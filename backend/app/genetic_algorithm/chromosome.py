import copy
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional


@dataclass
class Gene:
    exam_id: str
    slot_id: str
    room_id: str
    faculty_id: Optional[str] = None
    is_locked: bool = False

    def clone(self) -> "Gene":
        return Gene(
            exam_id=self.exam_id,
            slot_id=self.slot_id,
            room_id=self.room_id,
            faculty_id=self.faculty_id,
            is_locked=self.is_locked,
        )

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Gene":
        return cls(
            exam_id=data["exam_id"],
            slot_id=data["slot_id"],
            room_id=data["room_id"],
            faculty_id=data.get("faculty_id"),
            is_locked=data.get("is_locked", False),
        )


@dataclass
class Chromosome:
    genes: List[Gene] = field(default_factory=list)
    fitness: Optional[float] = None
    hard_violations: int = 0
    soft_penalty: float = 0.0
    is_valid: bool = False

    def clone(self) -> "Chromosome":
        cloned_genes = [g.clone() for g in self.genes]
        return Chromosome(
            genes=cloned_genes,
            fitness=self.fitness,
            hard_violations=self.hard_violations,
            soft_penalty=self.soft_penalty,
            is_valid=self.is_valid,
        )

    def get_gene_map(self) -> Dict[str, Gene]:
        return {g.exam_id: g for g in self.genes}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "genes": [g.to_dict() for g in self.genes],
            "fitness": self.fitness,
            "hard_violations": self.hard_violations,
            "soft_penalty": self.soft_penalty,
            "is_valid": self.is_valid,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Chromosome":
        genes = [Gene.from_dict(g) for g in data.get("genes", [])]
        return cls(
            genes=genes,
            fitness=data.get("fitness"),
            hard_violations=data.get("hard_violations", 0),
            soft_penalty=data.get("soft_penalty", 0.0),
            is_valid=data.get("is_valid", False),
        )
