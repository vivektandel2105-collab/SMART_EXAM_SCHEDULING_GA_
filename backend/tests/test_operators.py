import random
import pytest
from app.genetic_algorithm.chromosome import Gene, Chromosome
from app.genetic_algorithm.population import Population
from app.genetic_algorithm.constraints import ProblemDataset
from app.genetic_algorithm.selection import TournamentSelector
from app.genetic_algorithm.crossover import TimetableCrossover
from app.genetic_algorithm.mutation import TimetableMutation


def test_tournament_selection_picks_fittest():
    c1 = Chromosome(genes=[], fitness=100.0)
    c2 = Chromosome(genes=[], fitness=10.0)  # Fittest
    c3 = Chromosome(genes=[], fitness=50.0)
    pop = Population(chromosomes=[c1, c2, c3])

    selected = TournamentSelector.select(pop, tournament_size=3)
    assert selected.fitness == 10.0


def test_crossover_preserves_locked_genes():
    g1_a = Gene("ex-locked", "s-1", "r-1", is_locked=True)
    g2_a = Gene("ex-unlocked", "s-1", "r-1", is_locked=False)
    parent_a = Chromosome(genes=[g1_a, g2_a])

    g1_b = Gene("ex-locked", "s-1", "r-1", is_locked=True)
    g2_b = Gene("ex-unlocked", "s-2", "r-2", is_locked=False)
    parent_b = Chromosome(genes=[g1_b, g2_b])

    rng = random.Random(42)
    child_1, child_2 = TimetableCrossover.crossover(parent_a, parent_b, crossover_rate=1.0, rng=rng)

    # Verify locked gene is unchanged in both children
    locked_child1 = [g for g in child_1.genes if g.exam_id == "ex-locked"][0]
    locked_child2 = [g for g in child_2.genes if g.exam_id == "ex-locked"][0]
    assert locked_child1.slot_id == "s-1"
    assert locked_child2.slot_id == "s-1"
    assert locked_child1.is_locked is True


def test_crossover_rate_zero_returns_clones():
    g1 = Gene("ex-1", "s-1", "r-1")
    parent_a = Chromosome(genes=[g1])
    parent_b = Chromosome(genes=[g1.clone()])

    rng = random.Random(42)
    c1, c2 = TimetableCrossover.crossover(parent_a, parent_b, crossover_rate=0.0, rng=rng)
    assert c1.genes[0].slot_id == "s-1"


def test_mutation_skips_locked_genes():
    dataset = ProblemDataset(
        slot_details={"s1": {}, "s2": {}, "s3": {}},
        room_capacities={"r1": 50, "r2": 100},
    )
    g_locked = Gene("ex-locked", "s-1", "r-1", is_locked=True)
    g_unlocked = Gene("ex-unlocked", "s-1", "r-1", is_locked=False)
    chromosome = Chromosome(genes=[g_locked, g_unlocked])

    rng = random.Random(42)
    # Mutate with 100% mutation rate
    TimetableMutation.mutate(chromosome, dataset, mutation_rate=1.0, rng=rng)

    # Locked gene must be completely untouched
    assert g_locked.slot_id == "s-1"
    assert g_locked.room_id == "r-1"
    assert g_locked.is_locked is True


def test_operator_reproducibility_with_seed():
    dataset = ProblemDataset(
        slot_details={"s1": {}, "s2": {}, "s3": {}},
        room_capacities={"r1": 50, "r2": 100},
    )
    g1 = Gene("ex-1", "s-1", "r-1")
    g2 = Gene("ex-2", "s-2", "r-2")
    c1 = Chromosome(genes=[g1, g2])
    c2 = c1.clone()

    rng1 = random.Random(999)
    rng2 = random.Random(999)

    TimetableMutation.mutate(c1, dataset, mutation_rate=1.0, rng=rng1)
    TimetableMutation.mutate(c2, dataset, mutation_rate=1.0, rng=rng2)

    for g_a, g_b in zip(c1.genes, c2.genes):
        assert g_a.slot_id == g_b.slot_id
        assert g_a.room_id == g_b.room_id
