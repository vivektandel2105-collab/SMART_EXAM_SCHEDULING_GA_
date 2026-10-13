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

    # Precomputed caches for ultra-fast constraint evaluation
    subject_students: Dict[str, Set[str]] = field(default_factory=dict)
    subject_conflict_matrix: Dict[Tuple[str, str], int] = field(default_factory=dict)
    slot_overlaps: Dict[str, Set[str]] = field(default_factory=dict)

    def __post_init__(self):
        self.init_conflict_structures()

    def init_conflict_structures(self):
        """Precomputes student conflict matrix and slot time overlapping sets."""
        # 1. subject_students mapping
        subj_students: Dict[str, Set[str]] = {}
        for student_id, subjects in self.student_enrollments.items():
            for sub_id in subjects:
                subj_students.setdefault(sub_id, set()).add(student_id)
        self.subject_students = subj_students

        # 2. Ensure subject_students_count reflects actual enrollments if not explicitly set
        for sub_id, st_set in subj_students.items():
            if sub_id not in self.subject_students_count or self.subject_students_count[sub_id] == 0:
                self.subject_students_count[sub_id] = len(st_set)

        # 3. Precompute subject_conflict_matrix: (sub_a, sub_b) -> number of shared students
        all_subs = list(set(self.exam_subject_map.values()) | set(subj_students.keys()))
        conflict_mat: Dict[Tuple[str, str], int] = {}
        for i in range(len(all_subs)):
            s1 = all_subs[i]
            students_1 = subj_students.get(s1, set())
            for j in range(i + 1, len(all_subs)):
                s2 = all_subs[j]
                students_2 = subj_students.get(s2, set())
                overlap_count = len(students_1 & students_2)
                if overlap_count > 0:
                    conflict_mat[(s1, s2)] = overlap_count
                    conflict_mat[(s2, s1)] = overlap_count
        self.subject_conflict_matrix = conflict_mat

        # 4. Precompute slot_overlaps
        slot_overlaps: Dict[str, Set[str]] = {}
        slot_list = list(self.slot_details.keys())
        for s1 in slot_list:
            slot_overlaps[s1] = {s1}
            d1 = self.slot_details.get(s1, {})
            date_1 = str(d1.get("exam_date", ""))
            start_1 = d1.get("start_time")
            end_1 = d1.get("end_time")

            for s2 in slot_list:
                if s1 == s2:
                    continue
                d2 = self.slot_details.get(s2, {})
                date_2 = str(d2.get("exam_date", ""))

                if date_1 and date_2 and date_1 == date_2:
                    start_2 = d2.get("start_time")
                    end_2 = d2.get("end_time")
                    if start_1 and end_1 and start_2 and end_2:
                        if str(start_1) < str(end_2) and str(start_2) < str(end_1):
                            slot_overlaps[s1].add(s2)
                    else:
                        sess_1 = d1.get("session_name")
                        sess_2 = d2.get("session_name")
                        if sess_1 and sess_2 and sess_1 == sess_2:
                            slot_overlaps[s1].add(s2)
        self.slot_overlaps = slot_overlaps


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
        if not dataset.slot_overlaps:
            dataset.init_conflict_structures()

        violations = 0
        details: List[Dict[str, Any]] = []

        scheduled_exam_ids: List[str] = []
        slot_gene_map: Dict[str, List[Gene]] = {}
        room_gene_map: Dict[str, List[Gene]] = {}
        faculty_gene_map: Dict[str, List[Gene]] = {}

        for gene in genes:
            scheduled_exam_ids.append(gene.exam_id)
            slot_gene_map.setdefault(gene.slot_id, []).append(gene)
            if gene.room_id:
                room_gene_map.setdefault(gene.room_id, []).append(gene)
            if gene.faculty_id:
                faculty_gene_map.setdefault(gene.faculty_id, []).append(gene)

        # HC-01: Student Collision (overlapping exam slots for students taking both subjects)
        seen_student_clashes = set()
        for idx1 in range(len(genes)):
            g1 = genes[idx1]
            sub1 = dataset.exam_subject_map.get(g1.exam_id)
            if not sub1:
                continue
            overlapping_slots = dataset.slot_overlaps.get(g1.slot_id, {g1.slot_id})

            for idx2 in range(idx1 + 1, len(genes)):
                g2 = genes[idx2]
                if g2.slot_id in overlapping_slots:
                    sub2 = dataset.exam_subject_map.get(g2.exam_id)
                    if sub2 and sub1 != sub2:
                        shared_students = dataset.subject_conflict_matrix.get((sub1, sub2), 0)
                        if shared_students > 0:
                            pair_key = tuple(sorted([g1.exam_id, g2.exam_id]))
                            if pair_key not in seen_student_clashes:
                                seen_student_clashes.add(pair_key)
                                violations += shared_students
                                details.append({
                                    "code": "HC-01",
                                    "message": f"Student conflict: {shared_students} enrolled student(s) have overlapping exams '{g1.exam_id}' and '{g2.exam_id}' in slot '{g1.slot_id}'"
                                })

        # HC-02: Room Conflict (same room hosting overlapping exams)
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
                                violations += 1
                                details.append({
                                    "code": "HC-02",
                                    "message": f"Room conflict: Room '{room_id}' is double-booked for exams '{rg1.exam_id}' and '{rg2.exam_id}' at overlapping times"
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
                        "message": f"Capacity deficit: Room '{gene.room_id}' capacity ({cap}) is insufficient for exam '{gene.exam_id}' ({num_students} students)"
                    })

        # HC-04: Faculty Conflict (faculty supervising multiple rooms in overlapping slots)
        seen_fac_clashes = set()
        for fac_id, f_genes in faculty_gene_map.items():
            if len(f_genes) > 1:
                for i in range(len(f_genes)):
                    fg1 = f_genes[i]
                    overlapping_slots = dataset.slot_overlaps.get(fg1.slot_id, {fg1.slot_id})
                    for j in range(i + 1, len(f_genes)):
                        fg2 = f_genes[j]
                        if fg2.slot_id in overlapping_slots:
                            pair_key = tuple(sorted([fg1.exam_id, fg2.exam_id]))
                            if pair_key not in seen_fac_clashes:
                                seen_fac_clashes.add(pair_key)
                                violations += 1
                                details.append({
                                    "code": "HC-04",
                                    "message": f"Faculty conflict: Faculty '{fac_id}' assigned to multiple rooms in slot '{fg1.slot_id}'"
                                })

        # HC-05 & HC-07: Room & Slot Availability / Valid Resources
        for gene in genes:
            if gene.room_id and (gene.room_id, gene.slot_id) in dataset.room_unavailability:
                violations += 1
                details.append({
                    "code": "HC-05",
                    "message": f"Resource unavailable: Room '{gene.room_id}' is unavailable in slot '{gene.slot_id}'"
                })

            if gene.faculty_id and (gene.faculty_id, gene.slot_id) in dataset.faculty_unavailability:
                violations += 1
                details.append({
                    "code": "HC-06",
                    "message": f"Faculty unavailable: Faculty '{gene.faculty_id}' is unavailable in slot '{gene.slot_id}'"
                })

            slot_info = dataset.slot_details.get(gene.slot_id)
            if not slot_info or not slot_info.get("is_available", True):
                violations += 1
                details.append({
                    "code": "HC-07",
                    "message": f"Invalid slot: Slot '{gene.slot_id}' is unavailable or not registered"
                })

            if gene.room_id not in dataset.room_capacities:
                violations += 1
                details.append({
                    "code": "HC-05",
                    "message": f"Invalid room: Room '{gene.room_id}' is not registered in dataset"
                })

        # HC-08: Locked Assignment Preservation
        for gene in genes:
            if gene.exam_id in dataset.locked_assignments:
                target = dataset.locked_assignments[gene.exam_id]
                if gene.slot_id != target.get("slot_id") or gene.room_id != target.get("room_id"):
                    violations += 1
                    details.append({
                        "code": "HC-08",
                        "message": f"Locked alteration: Locked assignment for exam '{gene.exam_id}' was altered"
                    })

        # HC-10: Assignment Completeness & Duplicate Prevention
        unique_scheduled = set(scheduled_exam_ids)
        missing_exams = dataset.all_exam_ids - unique_scheduled
        if missing_exams:
            violations += len(missing_exams)
            details.append({
                "code": "HC-10",
                "message": f"Incomplete schedule: Missing {len(missing_exams)} exam(s): {list(missing_exams)}"
            })

        if len(scheduled_exam_ids) > len(unique_scheduled):
            dup_count = len(scheduled_exam_ids) - len(unique_scheduled)
            violations += dup_count
            details.append({
                "code": "HC-10",
                "message": f"Duplicate examinations: {dup_count} duplicate assignment(s) detected"
            })

        return violations, details

    @staticmethod
    def evaluate_soft_constraints(
        genes: List[Gene], dataset: ProblemDataset, weights: Dict[str, float]
    ) -> Tuple[float, Dict[str, float]]:
        soft_details: Dict[str, float] = {}

        # Build student schedule: student_id -> list of exam dates
        student_dates: Dict[str, List[datetime.date]] = {}
        for gene in genes:
            sub_id = dataset.exam_subject_map.get(gene.exam_id)
            slot_info = dataset.slot_details.get(gene.slot_id, {})
            exam_date = slot_info.get("exam_date")
            if sub_id and exam_date:
                if isinstance(exam_date, str):
                    try:
                        exam_date = datetime.date.fromisoformat(exam_date)
                    except Exception:
                        pass
                enrolled_students = dataset.subject_students.get(sub_id, set())
                for s_id in enrolled_students:
                    student_dates.setdefault(s_id, []).append(exam_date)

        same_day_penalty = 0.0
        consecutive_penalty = 0.0

        for s_id, d_list in student_dates.items():
            if len(d_list) > 1:
                # SC-02: Same-day multiple exams
                date_counts: Dict[Any, int] = {}
                for d in d_list:
                    date_counts[d] = date_counts.get(d, 0) + 1
                for d, count in date_counts.items():
                    if count > 1:
                        same_day_penalty += (count - 1)

                # SC-01: Consecutive day exam spacing
                unique_dates = [d for d in sorted(set(d_list)) if isinstance(d, datetime.date)]
                for i in range(len(unique_dates) - 1):
                    if (unique_dates[i + 1] - unique_dates[i]).days == 1:
                        consecutive_penalty += 1.0

        w_same_day = weights.get("SC-02", 50.0)
        w_consecutive = weights.get("SC-01", 10.0)

        soft_details["SC-02_same_day"] = same_day_penalty * w_same_day
        soft_details["SC-01_consecutive"] = consecutive_penalty * w_consecutive

        # SC-03: Room utilization efficiency
        utilization_penalty = 0.0
        for gene in genes:
            if gene.room_id:
                cap = dataset.room_capacities.get(gene.room_id, 0)
                sub_id = dataset.exam_subject_map.get(gene.exam_id)
                num_students = dataset.subject_students_count.get(sub_id, 0) if sub_id else 0
                if cap > num_students and cap > 0:
                    slack = cap - num_students
                    if slack > 50:
                        utilization_penalty += (slack / 50.0)

        w_utilization = weights.get("SC-03", 2.0)
        soft_details["SC-03_room_utilization"] = utilization_penalty * w_utilization

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
            weights = {"SC-01": 10.0, "SC-02": 50.0, "SC-03": 2.0}

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
