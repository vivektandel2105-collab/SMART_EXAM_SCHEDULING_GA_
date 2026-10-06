from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, UserRole
from app.models.student import Student
from app.schemas.auth import UserLogin, UserRegister, StudentSignup, UserResponse, Token
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db),
) -> Any:
    """JSON login endpoint returning JWT access token."""
    login_identifier = login_data.email.strip()
    normalized_email = login_identifier.lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        student_rec = db.query(Student).filter(Student.roll_number == login_identifier).first()
        if student_rec:
            user = db.query(User).filter(User.email == student_rec.email.lower()).first()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated",
        )

    access_token = create_access_token(subject=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def student_signup(
    signup_in: StudentSignup,
    db: Session = Depends(get_db),
) -> Any:
    """Public self-registration endpoint for Students."""
    if signup_in.password != signup_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and Confirm Password do not match.",
        )

    # Check duplicate email
    existing_user_email = db.query(User).filter(User.email == signup_in.email).first()
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user account with this email address already exists.",
        )

    # Check duplicate student_id / roll_number and student email.
    existing_student_id = db.query(Student).filter(Student.roll_number == signup_in.student_id).first()
    if existing_student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student ID '{signup_in.student_id}' is already registered.",
        )

    existing_student_email = db.query(Student).filter(Student.email == signup_in.email).first()
    if existing_student_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A student record with this email address already exists.",
        )

    # Hash user password securely. The password is supplied by the new user;
    # there is no shared/default student password.
    hashed_pwd = get_password_hash(signup_in.password)

    # Create User with STUDENT role.
    user = User(
        name=signup_in.name.strip(),
        email=signup_in.email.lower().strip(),
        password_hash=hashed_pwd,
        role=UserRole.STUDENT,
        is_active=True,
    )
    db.add(user)

    # Create the matching Student record using the credentials supplied by
    # this new user.
    student = Student(
        roll_number=signup_in.student_id.strip(),
        name=signup_in.name.strip(),
        email=signup_in.email.lower().strip(),
        status="ACTIVE",
    )
    db.add(student)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email or student ID is already registered. Please use different details.",
        )

    db.refresh(user)
    return user


@router.post("/login/token", response_model=Token)
def login_oauth2_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Any:
    """OAuth2 password form login endpoint for OpenAPI /docs compatibility."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_in: UserRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)
    ),
) -> Any:
    """Register a new user account (Requires SUPER_ADMIN or EXAM_ADMIN privileges)."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserResponse)
def read_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch current authenticated user profile."""
    return current_user
