import pytest
import datetime
from app.genetic_algorithm.chromosome import Gene, Chromosome
from app.genetic_algorithm.population import Population, PopulationGenerator
from app.genetic_algorithm.constraints import ProblemDataset
from app.genetic_algorithm.fitness import FitnessEvaluator, FitnessBreakdown


@pytest.fixture
def sample_dataset():
    return ProblemDataset(
        student_enrollments={
            "std-1": {"sub-1", "sub-2"},
            "std-2": {"sub-1", "sub-3"},
        },
        subject_students_count={"sub-1": 2, "sub-2": 1, "sub-3": 1},
        exam_subject_map={"ex-1": "sub-1", "ex-2": "sub-2", "ex-3": "sub-3"},
        room_capacities={"r-1": 100, "r-2": 100},
        slot_details={
            "s-1": {"exam_date": datetime.date(2026, 12, 10), "session_name": "MORNING", "is_available": True},
            "s-2": {"exam_date": datetime.date(2026, 12, 10), "session_name": "AFTERNOON", "is_available": True},
            "s-3": {"exam_date": datetime.date(2026, 12, 11), "session_name": "MORNING", "is_available": True},
        },
        all_exam_ids={"ex-1", "ex-2", "ex-3"}
    )


def test_clean_chromosome_zero_violations_fitness(sample_dataset):
    genes = [
        Gene("ex-1", "s-1", "r-1", "f-1"),
        Gene("ex-2", "s-2", "r-1", "f-2"),
        Gene("ex-3", "s-3", "r-1", "f-1"),
    ]
    c = Chromosome(genes=genes)
    breakdown = FitnessEvaluator.evaluate_chromosome(c, sample_dataset)

    assert breakdown.hard_violations == 0
    assert breakdown.is_valid is True
    assert c.fitness == breakdown.total_cost
    assert c.is_valid is True


def test_hard_violations_domination_over_soft_penalties(sample_dataset):
    # Chromosome 1: 1 hard violation (student clash ex-1 & ex-2 in s-1)
    c_hard_violation = Chromosome(genes=[
        Gene("ex-1", "s-1", "r-1", "f-1"),
        Gene("ex-2", "s-1", "r-2", "f-2"),  # Clash for std-1 in s-1!
        Gene("ex-3", "s-3", "r-1", "f-1"),
    ])

    # Chromosome 2: 0 hard violations, but high soft penalty
    c_soft_only = Chromosome(genes=[
        Gene("ex-1", "s-1", "r-1", "f-1"),
        Gene("ex-2", "s-2", "r-1", "f-1"),  # Same day for std-1 -> SC-02 penalty
        Gene("ex-3", "s-3", "r-1", "f-1"),
    ])

    b1 = FitnessEvaluator.evaluate_chromosome(c_hard_violation, sample_dataset, w_hard=10000.0)
    b2 = FitnessEvaluator.evaluate_chromosome(c_soft_only, sample_dataset, w_hard=10000.0)

    assert b1.hard_violations == 1
    assert b2.hard_violations == 0
    # 1 hard violation (10,000) must strictly dominate soft-only cost (~50.0)
    assert b1.total_cost > b2.total_cost


def test_fitness_breakdown_details(sample_dataset):
    genes = [
        Gene("ex-1", "s-1", "r-1", "f-1"),
        Gene("ex-2", "s-1", "r-1", "f-2"),  # Room conflict!
        Gene("ex-3", "s-3", "r-1", "f-1"),
    ]
    c = Chromosome(genes=genes)
    b = FitnessEvaluator.evaluate_chromosome(c, sample_dataset)

    assert b.hard_violations > 0
    assert len(b.hard_details) > 0
    assert isinstance(b.soft_breakdown, dict)


def test_evaluate_population_and_sort(sample_dataset):
    pop = PopulationGenerator.generate_initial_population(sample_dataset, population_size=10, random_seed=42)
    FitnessEvaluator.evaluate_population(pop, sample_dataset)

    # Verify population is sorted in ascending cost order
    for i in range(len(pop.chromosomes) - 1):
        assert pop.chromosomes[i].fitness <= pop.chromosomes[i+1].fitness


def test_fitness_calculation_determinism(sample_dataset):
    genes = [
        Gene("ex-1", "s-1", "r-1", "f-1"),
        Gene("ex-2", "s-2", "r-2", "f-2"),
        Gene("ex-3", "s-3", "r-1", "f-1"),
    ]
    c1 = Chromosome(genes=genes)
    c2 = Chromosome(genes=[g.clone() for g in genes])

    b1 = FitnessEvaluator.evaluate_chromosome(c1, sample_dataset)
    b2 = FitnessEvaluator.evaluate_chromosome(c2, sample_dataset)

    assert b1.total_cost == b2.total_cost
    assert b1.hard_violations == b2.hard_violations
