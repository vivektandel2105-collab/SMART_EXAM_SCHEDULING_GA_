import pytest
import datetime
from app.genetic_algorithm.chromosome import Gene, Chromosome
from app.genetic_algorithm.constraints import ProblemDataset
from app.genetic_algorithm.fitness import FitnessEvaluator
from app.genetic_algorithm.repair import TimetableRepair


@pytest.fixture
def repair_dataset():
    return ProblemDataset(
        student_enrollments={
            "std-1": {"sub-1", "sub-2"},
        },
        subject_students_count={"sub-1": 50, "sub-2": 50},
        exam_subject_map={"ex-1": "sub-1", "ex-2": "sub-2"},
        room_capacities={"r-small": 10, "r-large": 100, "r-large2": 100},
        slot_details={
            "s-1": {"exam_date": datetime.date(2026, 12, 10), "session_name": "MORNING", "is_available": True},
            "s-2": {"exam_date": datetime.date(2026, 12, 10), "session_name": "AFTERNOON", "is_available": True},
            "s-3": {"exam_date": datetime.date(2026, 12, 11), "session_name": "MORNING", "is_available": True},
        },
        locked_assignments={
            "ex-1": {"slot_id": "s-1", "room_id": "r-large", "faculty_id": "f-1"}
        },
        all_exam_ids={"ex-1", "ex-2"}
    )


def test_repair_student_conflict(repair_dataset):
    # Initial invalid chromosome: ex-2 assigned to s-1 (collides with locked ex-1 for std-1)
    genes = [
        Gene("ex-1", "s-1", "r-large", "f-1", is_locked=True),
        Gene("ex-2", "s-1", "r-large2", "f-2", is_locked=False),
    ]
    c = Chromosome(genes=genes)
    FitnessEvaluator.evaluate_chromosome(c, repair_dataset)
    assert c.hard_violations > 0

    repaired_c, result = TimetableRepair.repair(c, repair_dataset)
    assert result.repaired is True
    assert repaired_c.hard_violations == 0
    assert repaired_c.is_valid is True
    assert result.repairs_applied > 0


def test_repair_room_capacity_deficit(repair_dataset):
    # Initial invalid chromosome: ex-2 assigned to r-small (capacity 10 < 50 students)
    genes = [
        Gene("ex-1", "s-1", "r-large", "f-1", is_locked=True),
        Gene("ex-2", "s-2", "r-small", "f-2", is_locked=False),
    ]
    c = Chromosome(genes=genes)
    FitnessEvaluator.evaluate_chromosome(c, repair_dataset)
    assert c.hard_violations > 0

    repaired_c, result = TimetableRepair.repair(c, repair_dataset)
    assert result.repaired is True
    assert repaired_c.hard_violations == 0


def test_repair_preserves_locked_assignments(repair_dataset):
    genes = [
        Gene("ex-1", "s-1", "r-large", "f-1", is_locked=True),
        Gene("ex-2", "s-1", "r-large2", "f-2", is_locked=False),
    ]
    c = Chromosome(genes=genes)
    repaired_c, result = TimetableRepair.repair(c, repair_dataset)

    locked_gene = [g for g in repaired_c.genes if g.exam_id == "ex-1"][0]
    assert locked_gene.slot_id == "s-1"
    assert locked_gene.room_id == "r-large"
    assert locked_gene.is_locked is True


def test_unresolvable_conflict_remains_invalid():
    # Impossible dataset: 2 exams, only 1 slot, 1 room, 1 student taking both
    dataset = ProblemDataset(
        student_enrollments={"std-1": {"sub-1", "sub-2"}},
        subject_students_count={"sub-1": 10, "sub-2": 10},
        exam_subject_map={"ex-1": "sub-1", "ex-2": "sub-2"},
        room_capacities={"r-1": 100},
        slot_details={"s-1": {"exam_date": datetime.date(2026, 12, 10), "session_name": "MORNING", "is_available": True}},
        all_exam_ids={"ex-1", "ex-2"}
    )
    genes = [
        Gene("ex-1", "s-1", "r-1", "f-1"),
        Gene("ex-2", "s-1", "r-1", "f-2"),
    ]
    c = Chromosome(genes=genes)
    repaired_c, result = TimetableRepair.repair(c, dataset, max_attempts=5)

    assert result.repaired is False
    assert result.unresolved_violations > 0
    assert repaired_c.is_valid is False
