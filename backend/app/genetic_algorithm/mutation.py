import random
from typing import Optional, List
from app.genetic_algorithm.chromosome import Chromosome, Gene
from app.genetic_algorithm.constraints import ProblemDataset


class TimetableMutation:

    @classmethod
    def mutate(
        cls,
        chromosome: Chromosome,
        dataset: ProblemDataset,
        mutation_rate: float = 0.10,
        rng: Optional[random.Random] = None,
    ) -> Chromosome:
        """Apply random mutation operators while preserving locked assignments."""
        _rng = rng if rng is not None else random.Random()

        available_slots = list(dataset.slot_details.keys())
        available_rooms = list(dataset.room_capacities.keys())
        unlocked_genes = [g for g in chromosome.genes if not g.is_locked]

        if not unlocked_genes or not available_slots or not available_rooms:
            return chromosome

        mutated = False

        for gene in chromosome.genes:
            if gene.is_locked:
                continue

            if _rng.random() < mutation_rate:
                mutated = True
                op_choice = _rng.choice(["SLOT", "ROOM", "SWAP"])

                if op_choice == "SLOT":
                    gene.slot_id = _rng.choice(available_slots)

                elif op_choice == "ROOM":
                    gene.room_id = _rng.choice(available_rooms)

                elif op_choice == "SWAP" and len(unlocked_genes) > 1:
                    other_gene = _rng.choice(unlocked_genes)
                    if other_gene.exam_id != gene.exam_id:
                        gene.slot_id, other_gene.slot_id = other_gene.slot_id, gene.slot_id
                        gene.room_id, other_gene.room_id = other_gene.room_id, gene.room_id

        if mutated:
            chromosome.fitness = None
            chromosome.is_valid = False

        return chromosome
