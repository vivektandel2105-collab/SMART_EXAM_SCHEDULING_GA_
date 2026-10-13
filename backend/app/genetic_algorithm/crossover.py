import random
from typing import Tuple, Optional, Dict
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
        """Perform timetable-safe uniform crossover preserving chromosome completeness and locked genes.
        Crucially, never mutate parent chromosomes in place.
        """
        _rng = rng if rng is not None else random.Random()

        child_1 = parent_a.clone()
        child_2 = parent_b.clone()

        if _rng.random() > crossover_rate:
            return child_1, child_2

        # Reset fitness and validity on new offspring
        child_1.fitness = None
        child_1.is_valid = False
        child_2.fitness = None
        child_2.is_valid = False

        # Index child 2 genes by exam_id
        child_2_map: Dict[str, Gene] = {g.exam_id: g for g in child_2.genes}

        for gene_1 in child_1.genes:
            gene_2 = child_2_map.get(gene_1.exam_id)
            if not gene_2:
                continue

            # Preserve locked assignments untouched
            if gene_1.is_locked or gene_2.is_locked:
                continue

            # 50% uniform crossover swap
            if _rng.random() < 0.5:
                gene_1.slot_id, gene_2.slot_id = gene_2.slot_id, gene_1.slot_id
                gene_1.room_id, gene_2.room_id = gene_2.room_id, gene_1.room_id
                if gene_1.faculty_id or gene_2.faculty_id:
                    gene_1.faculty_id, gene_2.faculty_id = gene_2.faculty_id, gene_1.faculty_id

        return child_1, child_2
