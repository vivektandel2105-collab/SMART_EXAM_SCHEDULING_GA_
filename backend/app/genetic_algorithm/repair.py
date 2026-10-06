from dataclasses import dataclass
from typing import Tuple, List, Dict, Any, Optional

from app.genetic_algorithm.chromosome import Chromosome, Gene
from app.genetic_algorithm.constraints import ConstraintEvaluator, ProblemDataset
from app.genetic_algorithm.fitness import FitnessEvaluator


@dataclass
class RepairResult:
    repaired: bool
    repairs_applied: int
    unresolved_violations: int
    repaired_chromosome: Chromosome


class TimetableRepair:

    @classmethod
    def repair(
        cls,
        chromosome: Chromosome,
        dataset: ProblemDataset,
        max_attempts: int = 50,
    ) -> Tuple[Chromosome, RepairResult]:
        """Priority-guided heuristic repair mechanism for timetable chromosomes."""
        cloned_chromosome = chromosome.clone()
        FitnessEvaluator.evaluate_chromosome(cloned_chromosome, dataset)

        if cloned_chromosome.hard_violations == 0:
            return cloned_chromosome, RepairResult(
                repaired=True,
                repairs_applied=0,
                unresolved_violations=0,
                repaired_chromosome=cloned_chromosome,
            )

        available_slots = list(dataset.slot_details.keys())
        available_rooms = list(dataset.room_capacities.keys())
        repairs_count = 0

        for attempt in range(max_attempts):
            if cloned_chromosome.hard_violations == 0:
                break

            eval_res = ConstraintEvaluator.evaluate(cloned_chromosome.genes, dataset)
            if not eval_res.hard_details:
                break

            # Identify target violation
            violation = eval_res.hard_details[0]
            v_code = violation.get("code")

            repaired_in_attempt = False

            # Target unlocked genes for repair
            for gene in cloned_chromosome.genes:
                if gene.is_locked:
                    continue

                sub_id = dataset.exam_subject_map.get(gene.exam_id)
                num_students = dataset.subject_students_count.get(sub_id, 0) if sub_id else 0

                # 1. Resolve Room Capacity Deficit (HC-03)
                if v_code == "HC-03" and dataset.room_capacities.get(gene.room_id, 0) < num_students:
                    valid_rooms = [r for r, cap in dataset.room_capacities.items() if cap >= num_students]
                    if valid_rooms:
                        gene.room_id = valid_rooms[attempt % len(valid_rooms)]
                        repairs_count += 1
                        repaired_in_attempt = True
                        break

                # 2. Resolve Student Clash (HC-01) or Room Conflict (HC-02) or Faculty Conflict (HC-04)
                elif v_code in ("HC-01", "HC-02", "HC-04", "HC-05", "HC-06", "HC-07"):
                    exam_seed = sum(ord(c) for c in gene.exam_id)
                    alt_slot = available_slots[(attempt + exam_seed) % len(available_slots)]
                    alt_room = available_rooms[(attempt + exam_seed) % len(available_rooms)]
                    
                    # Ensure room capacity fits
                    if dataset.room_capacities.get(alt_room, 0) >= num_students:
                        gene.slot_id = alt_slot
                        gene.room_id = alt_room
                        repairs_count += 1
                        repaired_in_attempt = True
                        break

            if not repaired_in_attempt:
                break

            # Re-evaluate
            FitnessEvaluator.evaluate_chromosome(cloned_chromosome, dataset)

        final_eval = FitnessEvaluator.evaluate_chromosome(cloned_chromosome, dataset)
        is_fully_repaired = (final_eval.hard_violations == 0)

        return cloned_chromosome, RepairResult(
            repaired=is_fully_repaired,
            repairs_applied=repairs_count,
            unresolved_violations=final_eval.hard_violations,
            repaired_chromosome=cloned_chromosome,
        )
