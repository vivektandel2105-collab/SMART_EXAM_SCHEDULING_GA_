from dataclasses import dataclass, field
from typing import List, Dict, Set, Any, Tuple, Optional
import datetime


@dataclass
class ProblemDataset:
    student_enrollments: Dict[str, Set[str]] = field(default_factory=dict)  # student_id -> set of subject_ids
    subject_students_count: Dict[str, int] = field(default_factory=dict)   # subject_id -> count
    exam_subject_map: Dict[str, str] = field(default_factory=dict)         # exam_id -> subject_id
    room_capacities: Dict[str, int] = field(default_factory=dict)          # room_id -> capacity
    room_unavailability: Set[Tuple[str, str]] = field(default_factory=set)  # (room_id, slot_id)
    faculty_unavailability: Set[Tuple[str, str]] = field(default_factory=set) # (faculty_id, slot_id)
    slot_details: Dict[str, Dict[str, Any]] = field(default_factory=dict)  # slot_id -> {date, session_name, is_available}
    locked_assignments: Dict[str, Dict[str, str]] = field(default_factory=dict) # exam_id -> {slot_id, room_id, faculty_id}
    all_exam_ids: Set[str] = field(default_factory=set)


@dataclass
class Gene:
    exam_id: str
    slot_id: str
    room_id: str
    faculty_id: Optional[str] = None
    is_locked: bool = False


@dataclass
class ConstraintEvaluationResult:
    hard_violations: int
    hard_details: List[Dict[str, Any]]
    soft_penalty: float
    soft_details: Dict[str, float]
    total_cost: float
    is_valid: bool


class ConstraintEvaluator:

    @staticmethod
    def evaluate_hard_constraints(genes: List[Gene], dataset: ProblemDataset) -> Tuple[int, List[Dict[str, Any]]]:
        violations = 0
        details = []

        # Indexing for candidate schedule
        slot_exams: Dict[str, List[Gene]] = {}       # slot_id -> List[Gene]
        slot_rooms: Dict[Tuple[str, str], List[Gene]] = {}  # (slot_id, room_id) -> List[Gene]
        slot_faculty: Dict[Tuple[str, str], List[Gene]] = {}# (slot_id, faculty_id) -> List[Gene]
        scheduled_exam_ids = set()

        for gene in genes:
            scheduled_exam_ids.add(gene.exam_id)
            slot_exams.setdefault(gene.slot_id, []).append(gene)
            if gene.room_id:
                slot_rooms.setdefault((gene.slot_id, gene.room_id), []).append(gene)
            if gene.faculty_id:
                slot_faculty.setdefault((gene.slot_id, gene.faculty_id), []).append(gene)

        # HC-01: Student Collision (Student taking 2 exams in the same slot)
        for slot_id, slot_gene_list in slot_exams.items():
            slot_subject_ids = [dataset.exam_subject_map.get(g.exam_id) for g in slot_gene_list if g.exam_id in dataset.exam_subject_map]
            # Check pairwise student overlap
            for i in range(len(slot_subject_ids)):
                sub_i = slot_subject_ids[i]
                for j in range(i + 1, len(slot_subject_ids)):
                    sub_j = slot_subject_ids[j]
                    if sub_i and sub_j:
                        # Find overlapping students
                        for student_id, enrolled_subs in dataset.student_enrollments.items():
                            if sub_i in enrolled_subs and sub_j in enrolled_subs:
                                violations += 1
                                details.append({
                                    "code": "HC-01",
                                    "message": f"Student '{student_id}' has colliding exams for subjects '{sub_i}' and '{sub_j}' in slot '{slot_id}'"
                                })

        # HC-02: Room Conflict (Room hosting > 1 exam in same slot)
        for (slot_id, room_id), room_gene_list in slot_rooms.items():
            if len(room_gene_list) > 1:
                violation_count = len(room_gene_list) - 1
                violations += violation_count
                details.append({
                    "code": "HC-02",
                    "message": f"Room '{room_id}' is overbooked with {len(room_gene_list)} exams in slot '{slot_id}'"
                })

        # HC-03: Room Capacity Deficit
        for gene in genes:
            if gene.room_id:
                cap = dataset.room_capacities.get(gene.room_id, 0)
                sub_id = dataset.exam_subject_map.get(gene.exam_id)
                num_students = dataset.subject_students_count.get(sub_id, 0) if sub_id else 0
                if cap < num_students:
                    violations += 1
                    details.append({
                        "code": "HC-03",
                        "message": f"Room '{gene.room_id}' capacity ({cap}) is insufficient for exam '{gene.exam_id}' ({num_students} students)"
                    })

        # HC-04: Faculty Conflict (Faculty supervising > 1 room in same slot)
        for (slot_id, faculty_id), fac_gene_list in slot_faculty.items():
            if len(fac_gene_list) > 1:
                violations += (len(fac_gene_list) - 1)
                details.append({
                    "code": "HC-04",
                    "message": f"Faculty '{faculty_id}' assigned to {len(fac_gene_list)} rooms in slot '{slot_id}'"
                })

        # HC-05 & HC-06: Room and Faculty Availability
        for gene in genes:
            if gene.room_id and (gene.room_id, gene.slot_id) in dataset.room_unavailability:
                violations += 1
                details.append({
                    "code": "HC-05",
                    "message": f"Room '{gene.room_id}' is unavailable in slot '{gene.slot_id}'"
                })

            if gene.faculty_id and (gene.faculty_id, gene.slot_id) in dataset.faculty_unavailability:
                violations += 1
                details.append({
                    "code": "HC-06",
                    "message": f"Faculty '{gene.faculty_id}' is unavailable in slot '{gene.slot_id}'"
                })

            # HC-07: Slot Availability
            slot_info = dataset.slot_details.get(gene.slot_id)
            if slot_info and not slot_info.get("is_available", True):
                violations += 1
                details.append({
                    "code": "HC-07",
                    "message": f"Slot '{gene.slot_id}' is marked unavailable"
                })

        # HC-08: Locked Assignment Preservation
        for gene in genes:
            if gene.exam_id in dataset.locked_assignments:
                target = dataset.locked_assignments[gene.exam_id]
                if (gene.slot_id != target.get("slot_id") or
                    gene.room_id != target.get("room_id") or
                    (target.get("faculty_id") and gene.faculty_id != target.get("faculty_id"))):
                    violations += 1
                    details.append({
                        "code": "HC-08",
                        "message": f"Locked assignment for exam '{gene.exam_id}' was altered"
                    })

        # HC-10: Assignment Completeness
        missing_exams = dataset.all_exam_ids - scheduled_exam_ids
        if missing_exams:
            violations += len(missing_exams)
            details.append({
                "code": "HC-10",
                "message": f"Missing exam assignments for: {list(missing_exams)}"
            })

        return violations, details

    @staticmethod
    def evaluate_soft_constraints(
        genes: List[Gene], dataset: ProblemDataset, weights: Dict[str, float]
    ) -> Tuple[float, Dict[str, float]]:
        soft_details = {}
        total_soft_penalty = 0.0

        # SC-01: Consecutive & SC-02: Same-day exam spacing for students
        same_day_penalty = 0.0
        consecutive_penalty = 0.0

        # Build student timetable map: student_id -> List[(exam_date, session_name)]
        student_schedule: Dict[str, List[Tuple[datetime.date, str]]] = {}
        for gene in genes:
            sub_id = dataset.exam_subject_map.get(gene.exam_id)
            slot_info = dataset.slot_details.get(gene.slot_id)
            if sub_id and slot_info and "exam_date" in slot_info:
                e_date = slot_info["exam_date"]
                session = slot_info.get("session_name", "")
                for student_id, enrolled_subs in dataset.student_enrollments.items():
                    if sub_id in enrolled_subs:
                        student_schedule.setdefault(student_id, []).append((e_date, session))

        for student_id, dates_sessions in student_schedule.items():
            if len(dates_sessions) > 1:
                # Same day check
                date_counts: Dict[datetime.date, int] = {}
                for d, _ in dates_sessions:
                    date_counts[d] = date_counts.get(d, 0) + 1
                for d, count in date_counts.items():
                    if count > 1:
                        same_day_penalty += (count - 1)

                # Consecutive days check
                sorted_dates = sorted(set(d for d, _ in dates_sessions))
                for i in range(len(sorted_dates) - 1):
                    if (sorted_dates[i+1] - sorted_dates[i]).days == 1:
                        consecutive_penalty += 1.0

        w_same_day = weights.get("SC-02", 50.0)
        w_consecutive = weights.get("SC-01", 10.0)

        soft_details["SC-02_same_day"] = same_day_penalty * w_same_day
        soft_details["SC-01_consecutive"] = consecutive_penalty * w_consecutive

        # SC-04: Faculty Workload Imbalance
        faculty_counts: Dict[str, int] = {}
        for gene in genes:
            if gene.faculty_id:
                faculty_counts[gene.faculty_id] = faculty_counts.get(gene.faculty_id, 0) + 1

        w_faculty = weights.get("SC-04", 5.0)
        faculty_variance_penalty = 0.0
        if faculty_counts:
            max_duties = max(faculty_counts.values())
            min_duties = min(faculty_counts.values())
            faculty_variance_penalty = float(max_duties - min_duties)
        soft_details["SC-04_faculty_workload"] = faculty_variance_penalty * w_faculty

        total_soft_penalty = sum(soft_details.values())
        return total_soft_penalty, soft_details

    @classmethod
    def evaluate(
        cls,
        genes: List[Gene],
        dataset: ProblemDataset,
        weights: Optional[Dict[str, float]] = None,
        w_hard: float = 10000.0,
    ) -> ConstraintEvaluationResult:
        if weights is None:
            weights = {"SC-01": 10.0, "SC-02": 50.0, "SC-04": 5.0}

        hard_count, hard_details = cls.evaluate_hard_constraints(genes, dataset)
        soft_penalty, soft_details = cls.evaluate_soft_constraints(genes, dataset, weights)

        total_cost = (w_hard * hard_count) + soft_penalty
        is_valid = (hard_count == 0)

        return ConstraintEvaluationResult(
            hard_violations=hard_count,
            hard_details=hard_details,
            soft_penalty=soft_penalty,
            soft_details=soft_details,
            total_cost=total_cost,
            is_valid=is_valid,
        )
