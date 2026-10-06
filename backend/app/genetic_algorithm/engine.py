import time
import random
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Callable

from app.genetic_algorithm.chromosome import Chromosome
from app.genetic_algorithm.population import Population, PopulationGenerator
from app.genetic_algorithm.constraints import ProblemDataset
from app.genetic_algorithm.fitness import FitnessEvaluator
from app.genetic_algorithm.selection import TournamentSelector
from app.genetic_algorithm.crossover import TimetableCrossover
from app.genetic_algorithm.mutation import TimetableMutation
from app.genetic_algorithm.repair import TimetableRepair


@dataclass
class GAConfig:
    population_size: int = 100
    max_generations: int = 500
    crossover_rate: float = 0.80
    mutation_rate: float = 0.10
    elite_count: int = 5
    tournament_size: int = 5
    random_seed: Optional[int] = None
    time_limit_seconds: Optional[float] = None
    target_soft_penalty: Optional[float] = None


@dataclass
class GARunResult:
    status: str  # COMPLETED, TARGET_REACHED, MAX_GENERATIONS_REACHED, TIMEOUT, CANCELLED, FAILED
    generation: int
    best_chromosome: Chromosome
    best_fitness: float
    hard_violations: int
    soft_penalty: float
    execution_time_ms: int
    random_seed: Optional[int]
    metrics_history: List[Dict[str, Any]]


class GeneticAlgorithmEngine:

    @classmethod
    def run(
        cls,
        dataset: ProblemDataset,
        config: Optional[GAConfig] = None,
        cancellation_check: Optional[Callable[[], bool]] = None,
    ) -> GARunResult:
        """Execute complete Genetic Algorithm optimization loop."""
        if config is None:
            config = GAConfig()

        start_time = time.time()
        rng = random.Random(config.random_seed) if config.random_seed is not None else random.Random()

        # 1. Initialize Population
        population = PopulationGenerator.generate_initial_population(
            dataset=dataset,
            population_size=config.population_size,
            random_seed=config.random_seed,
        )

        # 2. Initial Evaluation
        FitnessEvaluator.evaluate_population(population, dataset)

        metrics_history: List[Dict[str, Any]] = []
        best = population.get_best()

        elapsed_ms = int((time.time() - start_time) * 1000)
        metrics_history.append({
            "generation": 0,
            "best_fitness": best.fitness,
            "hard_violations": best.hard_violations,
            "soft_penalty": best.soft_penalty,
            "is_valid": best.is_valid,
            "execution_time_ms": elapsed_ms,
        })

        run_status = "MAX_GENERATIONS_REACHED"

        # 3. Generational Optimization Loop
        for gen in range(1, config.max_generations + 1):
            # Check Cancellation
            if cancellation_check and cancellation_check():
                run_status = "CANCELLED"
                break

            # Check Time Limit
            if config.time_limit_seconds and (time.time() - start_time) >= config.time_limit_seconds:
                run_status = "TIMEOUT"
                break

            population.generation = gen

            # Extract Elites directly into next generation
            new_chromosomes = population.get_elites(config.elite_count)

            # Generate Offspring
            while len(new_chromosomes) < config.population_size:
                parent_1 = TournamentSelector.select(population, config.tournament_size, rng)
                parent_2 = TournamentSelector.select(population, config.tournament_size, rng)

                child_1, child_2 = TimetableCrossover.crossover(
                    parent_1, parent_2, config.crossover_rate, rng
                )

                # Mutate Offspring
                child_1 = TimetableMutation.mutate(child_1, dataset, config.mutation_rate, rng)
                child_2 = TimetableMutation.mutate(child_2, dataset, config.mutation_rate, rng)

                # Repair Offspring
                repaired_1, _ = TimetableRepair.repair(child_1, dataset)
                repaired_2, _ = TimetableRepair.repair(child_2, dataset)

                # Evaluate Offspring
                FitnessEvaluator.evaluate_chromosome(repaired_1, dataset)
                FitnessEvaluator.evaluate_chromosome(repaired_2, dataset)

                new_chromosomes.append(repaired_1)
                if len(new_chromosomes) < config.population_size:
                    new_chromosomes.append(repaired_2)

            population.chromosomes = new_chromosomes
            population.sort_by_fitness()

            best = population.get_best()
            elapsed_ms = int((time.time() - start_time) * 1000)

            metrics_history.append({
                "generation": gen,
                "best_fitness": best.fitness,
                "hard_violations": best.hard_violations,
                "soft_penalty": best.soft_penalty,
                "is_valid": best.is_valid,
                "execution_time_ms": elapsed_ms,
            })

            # Check Termination Condition (Zero Hard Violations & Target Soft Score)
            if best.hard_violations == 0:
                if config.target_soft_penalty is None or best.soft_penalty <= config.target_soft_penalty:
                    run_status = "TARGET_REACHED"
                    break

        final_best = population.get_best()
        final_elapsed_ms = int((time.time() - start_time) * 1000)

        return GARunResult(
            status=run_status,
            generation=population.generation,
            best_chromosome=final_best,
            best_fitness=final_best.fitness,
            hard_violations=final_best.hard_violations,
            soft_penalty=final_best.soft_penalty,
            execution_time_ms=final_elapsed_ms,
            random_seed=config.random_seed,
            metrics_history=metrics_history,
        )
