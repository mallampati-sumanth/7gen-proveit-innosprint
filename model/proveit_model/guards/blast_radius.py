from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class PolicyVerdict(BaseModel):
    allowed: bool
    blast_radius: int  # 0 to 100
    requires_approval: bool
    reasons: List[str] = Field(default_factory=list)


class BlastRadiusGuard:
    @staticmethod
    def evaluate(action: str, environment: str = "production", parameters: Optional[Dict[str, Any]] = None) -> PolicyVerdict:
        params = parameters or {}
        score = 10
        reasons = []

        if environment.lower() == "production":
            score += 25
            reasons.append("Targeting production environment (+25)")

        if "delete" in action.lower() or "terminate" in action.lower():
            score += 40
            reasons.append("Destructive deletion action (+40)")
        elif "deploy" in action.lower() or "update" in action.lower():
            score += 15
            reasons.append("State modification update (+15)")

        if params.get("memory_mb", 512) > 2048:
            score += 20
            reasons.append("High resource allocation requested (+20)")

        requires_approval = score >= 50
        # If approval is required, allowed is False unless explicit approval is passed
        allowed = not requires_approval or bool(params.get("approved", False))

        return PolicyVerdict(
            allowed=allowed,
            blast_radius=min(score, 100),
            requires_approval=requires_approval,
            reasons=reasons,
        )
