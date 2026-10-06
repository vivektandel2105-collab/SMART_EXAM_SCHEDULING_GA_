import random
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

from app.genetic_algorithm.chromosome import Chromosome, Gene
from app.genetic_algorithm.constraints import ProblemDataset


@dataclass
class Population:
    chromosomes: List[Chromosome] = field(default_factory=list)
    generation: int = 0

    def sort_by_fitness(self) -> None:
        """Sort chromosomes ascending by fitness cost (lower is better)."""
        self.chromosomes.sort(
            key=lambda c: (c.fitness if c.fitness is not None else float("inf"))
        )

    def get_best(self) -> Optional[Chromosome]:
        if not self.chromosomes:
            return None
        self.sort_by_fitness()
        return self.chromosomes[0]

    def get_elites(self, count: int) -> List[Chromosome]:
        self.sort_by_fitness()
        elite_count = min(count, len(self.chromosomes))
        return [c.clone() for c in self.chromosomes[:elite_count]]

    def to_dict(self) -> Dict[str, Any]:
        best = self.get_best()
        return {
            "generation": self.generation,
            "population_size": len(self.chromosomes),
            "best_fitness": best.fitness if best else None,
            "best_hard_violations": best.hard_violations if best else None,
            "best_is_valid": best.is_valid if best else False,
        }


class PopulationGenerator:

    @classmethod
    def generate_initial_population(
        cls,
        dataset: ProblemDataset,
        population_size: int = 100,
        random_seed: Optional[int] = None,
    ) -> Population:
        """Generate initial candidate timetable population."""
        rng = random.Random(random_seed) if random_seed is not None else random.Random()

        available_slot_ids = list(dataset.slot_details.keys())
        available_room_ids = list(dataset.room_capacities.keys())
        all_exams = list(dataset.all_exam_ids)

        if not available_slot_ids or not available_room_ids:
            raise ValueError("Cannot generate population: No available slots or rooms in problem dataset.")

        chromosomes: List[Chromosome] = []

        for _ in range(population_size):
            genes: List[Gene] = []
            for exam_id in all_exams:
                # Check locked assignment
                if exam_id in dataset.locked_assignments:
                    locked = dataset.locked_assignments[exam_id]
                    gene = Gene(
                        exam_id=exam_id,
                        slot_id=locked["slot_id"],
                        room_id=locked["room_id"],
                        faculty_id=locked.get("faculty_id"),
                        is_locked=True,
                    )
                else:
                    slot_id = rng.choice(available_slot_ids)
                    room_id = rng.choice(available_room_ids)
                    gene = Gene(
                        exam_id=exam_id,
                        slot_id=slot_id,
                        room_id=room_id,
                        is_locked=False,
                    )
                genes.append(gene)

            chromosomes.append(Chromosome(genes=genes))

        return Population(chromosomes=chromosomes, generation=0)
