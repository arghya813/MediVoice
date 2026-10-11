from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MedicationDetails(BaseModel):
    medication_name: str = Field(
        description="Trade/brand name printed on the bottle, or the drug name printed clearly."
    )
    drug_name: Optional[str] = Field(
        default=None,
        description="Generic/chemical name of the drug, e.g. 'acetaminophen'.",
    )
    purpose: Optional[str] = Field(
        default=None,
        description="What the medicine is for, in simple words. Provide a short explanation of the condition(s) it treats (e.g. 'used to reduce fever and relieve mild to moderate pain').",
    )
    intake_dosage: list[str] = Field(
        description="Dosage instructions rewritten as simple list items, numbers and units exact.",
    )
    critical_warnings: list[str] = Field(
        description="Critical warnings and conditions, e.g. don't take with alcohol, keep refrigerated, may cause drowsiness.",
    )
    expiry_date: Optional[str] = Field(
        default=None,
        description="Expiry as YYYY-MM or MM/YYYY. null if the label does not show it.",
    )
    low_confidence: bool = Field(
        default=False,
        description="True when the label is blurred, tiny, or unreadable and you could not extract details reliably.",
    )


class ScanResponse(MedicationDetails):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    image_count: int = 1
    image_filename: Optional[str] = None


class ScansResponse(BaseModel):
    count: int
    items: list[ScanResponse]


class HealthResponse(BaseModel):
    status: str
    gemini_configured: bool