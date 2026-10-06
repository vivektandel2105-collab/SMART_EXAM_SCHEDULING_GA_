from dataclasses import dataclass
from typing import List, Dict, Any, Optional

from app.genetic_algorithm.chromosome import Chromosome
from app.genetic_algorithm.population import Population
from app.genetic_algorithm.constraints import ConstraintEvaluator, ProblemDataset


@dataclass
class FitnessBreakdown:
    hard_violations: int
    hard_details: List[Dict[str, Any]]
    soft_penalty: float
    soft_breakdown: Dict[str, float]
    total_cost: float
    is_valid: bool


class FitnessEvaluator:

    @classmethod
    def evaluate_chromosome(
        cls,
        chromosome: Chromosome,
        dataset: ProblemDataset,
        weights: Optional[Dict[str, float]] = None,
        w_hard: float = 10000.0,
    ) -> FitnessBreakdown:
        """Evaluate chromosome cost score, update internal attributes, and return breakdown."""
        res = ConstraintEvaluator.evaluate(
            genes=chromosome.genes,
            dataset=dataset,
            weights=weights,
            w_hard=w_hard,
        )

        chromosome.fitness = res.total_cost
        chromosome.hard_violations = res.hard_violations
        chromosome.soft_penalty = res.soft_penalty
        chromosome.is_valid = res.is_valid

        return FitnessBreakdown(
            hard_violations=res.hard_violations,
            hard_details=res.hard_details,
            soft_penalty=res.soft_penalty,
            soft_breakdown=res.soft_details,
            total_cost=res.total_cost,
            is_valid=res.is_valid,
        )

    @classmethod
    def evaluate_population(
        cls,
        population: Population,
        dataset: ProblemDataset,
        weights: Optional[Dict[str, float]] = None,
        w_hard: float = 10000.0,
    ) -> None:
        """Evaluate all chromosomes in population and sort population ascending by fitness."""
        for chromosome in population.chromosomes:
            cls.evaluate_chromosome(chromosome, dataset, weights, w_hard)
        population.sort_by_fitness()
