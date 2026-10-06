import pytest
import datetime
from app.genetic_algorithm.constraints import ProblemDataset
from app.genetic_algorithm.engine import GeneticAlgorithmEngine, GAConfig


@pytest.fixture
def sample_dataset():
    return ProblemDataset(
        student_enrollments={
            "std-1": {"sub-1", "sub-2"},
            "std-2": {"sub-1", "sub-3"},
            "std-3": {"sub-2", "sub-3"},
        },
        subject_students_count={"sub-1": 2, "sub-2": 2, "sub-3": 2},
        exam_subject_map={"ex-1": "sub-1", "ex-2": "sub-2", "ex-3": "sub-3"},
        room_capacities={"r-1": 100, "r-2": 100},
        slot_details={
            "s-1": {"exam_date": datetime.date(2026, 12, 10), "session_name": "MORNING", "is_available": True},
            "s-2": {"exam_date": datetime.date(2026, 12, 10), "session_name": "AFTERNOON", "is_available": True},
            "s-3": {"exam_date": datetime.date(2026, 12, 11), "session_name": "MORNING", "is_available": True},
        },
        all_exam_ids={"ex-1", "ex-2", "ex-3"}
    )


def test_ga_engine_run_reaches_zero_violations(sample_dataset):
    config = GAConfig(
        population_size=20,
        max_generations=50,
        random_seed=42,
    )
    res = GeneticAlgorithmEngine.run(sample_dataset, config)

    assert res.status == "TARGET_REACHED"
    assert res.hard_violations == 0
    assert res.best_chromosome.is_valid is True
    assert len(res.metrics_history) > 0


def test_ga_engine_seed_reproducibility(sample_dataset):
    config1 = GAConfig(population_size=20, max_generations=30, random_seed=12345)
    config2 = GAConfig(population_size=20, max_generations=30, random_seed=12345)

    res1 = GeneticAlgorithmEngine.run(sample_dataset, config1)
    res2 = GeneticAlgorithmEngine.run(sample_dataset, config2)

    assert res1.generation == res2.generation
    assert res1.best_fitness == res2.best_fitness
    assert res1.hard_violations == res2.hard_violations


def test_ga_engine_cancellation_handler(sample_dataset):
    config = GAConfig(population_size=20, max_generations=100, random_seed=42)
    res = GeneticAlgorithmEngine.run(sample_dataset, config, cancellation_check=lambda: True)
    assert res.status == "CANCELLED"


def test_ga_engine_timeout(sample_dataset):
    config = GAConfig(population_size=50, max_generations=1000, time_limit_seconds=0.001)
    res = GeneticAlgorithmEngine.run(sample_dataset, config)
    assert res.status in ("TIMEOUT", "TARGET_REACHED")
