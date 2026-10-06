import random
from typing import Optional
from app.genetic_algorithm.chromosome import Chromosome
from app.genetic_algorithm.population import Population


class TournamentSelector:

    @classmethod
    def select(
        cls,
        population: Population,
        tournament_size: int = 5,
        rng: Optional[random.Random] = None,
    ) -> Chromosome:
        """Select fittest parent using tournament selection."""
        if not population.chromosomes:
            raise ValueError("Cannot select parent from an empty population.")

        _rng = rng if rng is not None else random.Random()

        actual_size = min(tournament_size, len(population.chromosomes))
        tournament_pool = _rng.sample(population.chromosomes, actual_size)

        # Pick candidate with lowest fitness score
        tournament_pool.sort(
            key=lambda c: (c.fitness if c.fitness is not None else float("inf"))
        )

        return tournament_pool[0].clone()
