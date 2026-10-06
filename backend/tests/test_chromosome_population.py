import pytest
import datetime
from app.genetic_algorithm.chromosome import Gene, Chromosome
from app.genetic_algorithm.population import Population, PopulationGenerator
from app.genetic_algorithm.constraints import ProblemDataset


def test_gene_clone_and_serialization():
    g1 = Gene(exam_id="ex-1", slot_id="slot-1", room_id="room-1", faculty_id="fac-1", is_locked=True)
    g2 = g1.clone()

    assert g2.exam_id == "ex-1"
    assert g2.is_locked is True

    # Mutate g2, verify g1 is untouched
    g2.slot_id = "slot-2"
    assert g1.slot_id == "slot-1"

    # Dict roundtrip
    d = g1.to_dict()
    g3 = Gene.from_dict(d)
    assert g3.exam_id == g1.exam_id
    assert g3.is_locked == g1.is_locked


def test_chromosome_deep_clone():
    g1 = Gene(exam_id="ex-1", slot_id="slot-1", room_id="room-1")
    g2 = Gene(exam_id="ex-2", slot_id="slot-2", room_id="room-2")
    c1 = Chromosome(genes=[g1, g2], fitness=45.0, hard_violations=1)

    c2 = c1.clone()
    assert c2.fitness == 45.0
    assert len(c2.genes) == 2

    # Mutate gene in c2
    c2.genes[0].slot_id = "slot-99"
    assert c1.genes[0].slot_id == "slot-1"


def test_chromosome_serialization():
    g1 = Gene(exam_id="ex-1", slot_id="slot-1", room_id="room-1")
    c1 = Chromosome(genes=[g1], fitness=12.5, hard_violations=0, is_valid=True)

    d = c1.to_dict()
    c2 = Chromosome.from_dict(d)
    assert c2.fitness == 12.5
    assert c2.is_valid is True
    assert c2.genes[0].exam_id == "ex-1"


def test_population_sorting_and_elites():
    c1 = Chromosome(genes=[], fitness=100.0)
    c2 = Chromosome(genes=[], fitness=10.0)
    c3 = Chromosome(genes=[], fitness=50.0)

    pop = Population(chromosomes=[c1, c2, c3], generation=1)
    best = pop.get_best()
    assert best.fitness == 10.0

    elites = pop.get_elites(2)
    assert len(elites) == 2
    assert elites[0].fitness == 10.0
    assert elites[1].fitness == 50.0


def test_deterministic_population_generator():
    dataset = ProblemDataset(
        slot_details={"s1": {}, "s2": {}},
        room_capacities={"r1": 50, "r2": 100},
        locked_assignments={"ex-locked": {"slot_id": "s1", "room_id": "r1", "faculty_id": "f1"}},
        all_exam_ids={"ex-locked", "ex-2", "ex-3"}
    )

    # Generate pop with seed 42
    pop1 = PopulationGenerator.generate_initial_population(dataset, population_size=10, random_seed=42)
    # Generate pop with seed 42 again
    pop2 = PopulationGenerator.generate_initial_population(dataset, population_size=10, random_seed=42)

    # Verify identical gene assignments across pop1 and pop2
    for c1, c2 in zip(pop1.chromosomes, pop2.chromosomes):
        for g1, g2 in zip(c1.genes, c2.genes):
            assert g1.exam_id == g2.exam_id
            assert g1.slot_id == g2.slot_id
            assert g1.room_id == g2.room_id

    # Verify locked assignment preservation
    for c in pop1.chromosomes:
        g_locked = [g for g in c.genes if g.exam_id == "ex-locked"][0]
        assert g_locked.is_locked is True
        assert g_locked.slot_id == "s1"
        assert g_locked.room_id == "r1"
