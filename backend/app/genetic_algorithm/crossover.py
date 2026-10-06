import random
from typing import Tuple, Optional
from app.genetic_algorithm.chromosome import Chromosome, Gene


class TimetableCrossover:

    @classmethod
    def crossover(
        cls,
        parent_a: Chromosome,
        parent_b: Chromosome,
        crossover_rate: float = 0.80,
        rng: Optional[random.Random] = None,
    ) -> Tuple[Chromosome, Chromosome]:
        """Perform timetable-safe uniform crossover while preserving locked genes."""
        _rng = rng if rng is not None else random.Random()

        child_1 = parent_a.clone()
        child_2 = parent_b.clone()

        if _rng.random() > crossover_rate:
            return child_1, child_2

        # Reset fitness scores on offspring
        child_1.fitness = None
        child_1.is_valid = False
        child_2.fitness = None
        child_2.is_valid = False

        # Index parent B genes by exam_id for safe alignment
        parent_b_map = parent_b.get_gene_map()

        for idx, gene_1 in enumerate(child_1.genes):
            gene_2 = parent_b_map.get(gene_1.exam_id)
            if not gene_2:
                continue

            # Preserved locked assignments untouched
            if gene_1.is_locked or gene_2.is_locked:
                continue

            # 50% uniform crossover swap for unlocked genes
            if _rng.random() < 0.5:
                # Swap slot, room, and faculty between child 1 and child 2
                gene_1.slot_id, gene_2.slot_id = gene_2.slot_id, gene_1.slot_id
                gene_1.room_id, gene_2.room_id = gene_2.room_id, gene_1.room_id
                gene_1.faculty_id, gene_2.faculty_id = gene_2.faculty_id, gene_1.faculty_id

                # Update child_2 gene array
                child_2.genes[idx] = gene_2.clone()

        return child_1, child_2
