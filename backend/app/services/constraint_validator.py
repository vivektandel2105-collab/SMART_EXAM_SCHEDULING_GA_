from dataclasses import dataclass, field, asdict
from typing import List, Dict, Set, Any, Tuple, Optional
import datetime
from sqlalchemy.orm import Session

from app.models.timetable import TimetableVersion
from app.models.exam import ExamAssignment, ExamSlot, Exam
from app.models.subject import Subject
from app.models.room import Room
from app.models.student import Student, StudentSubject
from app.genetic_algorithm.constraints import ProblemDataset, Gene


@dataclass
class ConflictDetail:
    constraint_type: str  # STUDENT_CONFLICT, ROOM_CONFLICT, CAPACITY_VIOLATION, INVALID_RESOURCE, COMPLETENESS
    severity: str        # HARD, SOFT
    message: str
    exam_id_1: Optional[str] = None
    exam_id_2: Optional[str] = None
    slot_id: Optional[str] = None
    room_id: Optional[str] = None
    student_ids: List[str] = field(default_factory=list)


@dataclass
class ValidationReport:
    is_valid: bool
    total_hard_violations: int
    student_conflict_count: int
    room_conflict_count: int
    capacity_violation_count: int
    invalid_assignment_count: int
    missing_exam_count: int
    duplicate_exam_count: int
    total_exams_expected: int
    total_exams_assigned: int
    conflicts: List[Dict[str, Any]] = field(default_factory=list)
    summary_message: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class IndependentConstraintValidator:
    """Independent validator verifying final timetable schedules completely separate
    from the internal Genetic Algorithm fitness evaluation.
    """

    @classmethod
    def validate_chromosome(
        cls,
        chromosome_genes: List[Gene],
        dataset: ProblemDataset,
    ) -> ValidationReport:
        if not dataset.slot_overlaps:
            dataset.init_conflict_structures()

        conflicts: List[Dict[str, Any]] = []
        student_conflict_count = 0
        room_conflict_count = 0
        capacity_violation_count = 0
        invalid_assignment_count = 0
        missing_exam_count = 0
        duplicate_exam_count = 0

        total_expected = len(dataset.all_exam_ids)
        total_assigned = len(chromosome_genes)

        scheduled_exam_ids: List[str] = []
        slot_gene_map: Dict[str, List[Gene]] = {}
        room_gene_map: Dict[str, List[Gene]] = {}

        for gene in chromosome_genes:
            scheduled_exam_ids.append(gene.exam_id)
            slot_gene_map.setdefault(gene.slot_id, []).append(gene)
            if gene.room_id:
                room_gene_map.setdefault(gene.room_id, []).append(gene)

        # 1. Check Completeness & Duplicates
        unique_exams = set(scheduled_exam_ids)
        missing = dataset.all_exam_ids - unique_exams
        if missing:
            missing_exam_count = len(missing)
            for m in missing:
                conflicts.append({
                    "constraint_type": "COMPLETENESS",
                    "severity": "HARD",
                    "message": f"Examination '{m}' is missing from the schedule.",
                    "exam_id_1": m,
                })

        if len(scheduled_exam_ids) > len(unique_exams):
            seen_set = set()
            for eid in scheduled_exam_ids:
                if eid in seen_set:
                    duplicate_exam_count += 1
                    conflicts.append({
                        "constraint_type": "COMPLETENESS",
                        "severity": "HARD",
                        "message": f"Examination '{eid}' is duplicated in the timetable.",
                        "exam_id_1": eid,
                    })
                seen_set.add(eid)

        # 2. Check Student Conflicts (Actual shared enrollments at overlapping times)
        seen_student_clashes = set()
        for i in range(len(chromosome_genes)):
            g1 = chromosome_genes[i]
            sub1 = dataset.exam_subject_map.get(g1.exam_id)
            if not sub1:
                continue
            overlapping_slots = dataset.slot_overlaps.get(g1.slot_id, {g1.slot_id})

            for j in range(i + 1, len(chromosome_genes)):
                g2 = chromosome_genes[j]
                if g2.slot_id in overlapping_slots:
                    sub2 = dataset.exam_subject_map.get(g2.exam_id)
                    if sub2 and sub1 != sub2:
                        shared_count = dataset.subject_conflict_matrix.get((sub1, sub2), 0)
                        if shared_count > 0:
                            pair_key = tuple(sorted([g1.exam_id, g2.exam_id]))
                            if pair_key not in seen_student_clashes:
                                seen_student_clashes.add(pair_key)
                                student_conflict_count += shared_count

                                # Retrieve specific conflicting students
                                st1 = dataset.subject_students.get(sub1, set())
                                st2 = dataset.subject_students.get(sub2, set())
                                clash_students = list(st1 & st2)[:5]

                                conflicts.append({
                                    "constraint_type": "STUDENT_CONFLICT",
                                    "severity": "HARD",
                                    "message": f"Student timetable clash: {shared_count} student(s) enrolled in both '{sub1}' and '{sub2}' have overlapping exams ('{g1.exam_id}' and '{g2.exam_id}') in slot '{g1.slot_id}'.",
                                    "exam_id_1": g1.exam_id,
                                    "exam_id_2": g2.exam_id,
                                    "slot_id": g1.slot_id,
                                    "student_ids": clash_students,
                                })

        # 3. Check Room Conflicts (Same room assigned to overlapping exams)
        seen_room_clashes = set()
        for room_id, r_genes in room_gene_map.items():
            if len(r_genes) > 1:
                for i in range(len(r_genes)):
                    rg1 = r_genes[i]
                    overlapping_slots = dataset.slot_overlaps.get(rg1.slot_id, {rg1.slot_id})
                    for j in range(i + 1, len(r_genes)):
                        rg2 = r_genes[j]
                        if rg2.slot_id in overlapping_slots:
                            pair_key = tuple(sorted([rg1.exam_id, rg2.exam_id]))
                            if pair_key not in seen_room_clashes:
                                seen_room_clashes.add(pair_key)
                                room_conflict_count += 1
                                conflicts.append({
                                    "constraint_type": "ROOM_CONFLICT",
                                    "severity": "HARD",
                                    "message": f"Room clash: Room '{room_id}' is double-booked for exams '{rg1.exam_id}' and '{rg2.exam_id}' at overlapping times.",
                                    "exam_id_1": rg1.exam_id,
                                    "exam_id_2": rg2.exam_id,
                                    "room_id": room_id,
                                    "slot_id": rg1.slot_id,
                                })

        # 4. Check Room Capacity
        for gene in chromosome_genes:
            if gene.room_id:
                cap = dataset.room_capacities.get(gene.room_id, 0)
                sub_id = dataset.exam_subject_map.get(gene.exam_id)
                enrolled = dataset.subject_students_count.get(sub_id, 0) if sub_id else 0
                if cap < enrolled:
                    capacity_violation_count += 1
                    conflicts.append({
                        "constraint_type": "CAPACITY_VIOLATION",
                        "severity": "HARD",
                        "message": f"Room capacity exceeded: Room '{gene.room_id}' has capacity {cap}, but exam '{gene.exam_id}' ({sub_id}) has {enrolled} students.",
                        "exam_id_1": gene.exam_id,
                        "room_id": gene.room_id,
                    })

        # 5. Check Resource Validity & Availability
        for gene in chromosome_genes:
            if gene.room_id not in dataset.room_capacities:
                invalid_assignment_count += 1
                conflicts.append({
                    "constraint_type": "INVALID_RESOURCE",
                    "severity": "HARD",
                    "message": f"Invalid room: Room '{gene.room_id}' is not an available room.",
                    "exam_id_1": gene.exam_id,
                    "room_id": gene.room_id,
                })
            elif (gene.room_id, gene.slot_id) in dataset.room_unavailability:
                invalid_assignment_count += 1
                conflicts.append({
                    "constraint_type": "INVALID_RESOURCE",
                    "severity": "HARD",
                    "message": f"Room unavailable: Room '{gene.room_id}' is marked unavailable in slot '{gene.slot_id}'.",
                    "exam_id_1": gene.exam_id,
                    "room_id": gene.room_id,
                    "slot_id": gene.slot_id,
                })

            slot_info = dataset.slot_details.get(gene.slot_id)
            if not slot_info or not slot_info.get("is_available", True):
                invalid_assignment_count += 1
                conflicts.append({
                    "constraint_type": "INVALID_RESOURCE",
                    "severity": "HARD",
                    "message": f"Invalid slot: Slot '{gene.slot_id}' is invalid or marked unavailable.",
                    "exam_id_1": gene.exam_id,
                    "slot_id": gene.slot_id,
                })

        total_hard = (
            student_conflict_count
            + room_conflict_count
            + capacity_violation_count
            + invalid_assignment_count
            + missing_exam_count
            + duplicate_exam_count
        )

        is_valid = (total_hard == 0) and (total_expected > 0) and (total_assigned == total_expected)

        if is_valid:
            summary = "Timetable successfully validated: 0 hard-constraint violations detected. All exams scheduled clash-free."
        else:
            summary = f"Timetable validation failed: {total_hard} hard-constraint violation(s) found ({student_conflict_count} student conflicts, {room_conflict_count} room conflicts, {capacity_violation_count} capacity deficits, {missing_exam_count} missing exams)."

        return ValidationReport(
            is_valid=is_valid,
            total_hard_violations=total_hard,
            student_conflict_count=student_conflict_count,
            room_conflict_count=room_conflict_count,
            capacity_violation_count=capacity_violation_count,
            invalid_assignment_count=invalid_assignment_count,
            missing_exam_count=missing_exam_count,
            duplicate_exam_count=duplicate_exam_count,
            total_exams_expected=total_expected,
            total_exams_assigned=total_assigned,
            conflicts=conflicts,
            summary_message=summary,
        )

    @classmethod
    def validate_persisted_version(
        cls,
        db: Session,
        version_id: str,
    ) -> ValidationReport:
        """Validates a persisted TimetableVersion against the database state."""
        from app.services.scheduler_service import build_problem_dataset

        version = db.query(TimetableVersion).filter(TimetableVersion.id == version_id).first()
        if not version:
            raise ValueError(f"Timetable version '{version_id}' not found.")

        dataset = build_problem_dataset(db)
        assignments = db.query(ExamAssignment).filter(ExamAssignment.timetable_version_id == version_id).all()

        genes: List[Gene] = []
        for a in assignments:
            genes.append(Gene(
                exam_id=a.exam_id,
                slot_id=a.slot_id or "",
                room_id=a.room_id or "",
                faculty_id=a.faculty_id,
                is_locked=a.is_locked,
            ))

        return cls.validate_chromosome(genes, dataset)
