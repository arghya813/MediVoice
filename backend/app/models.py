from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String, Text

from .database import Base


class MedicationScan(Base):
    __tablename__ = "medication_scans"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    medication_name = Column(String, nullable=False)
    drug_name = Column(String, nullable=True)
    purpose = Column(Text, nullable=True)
    intake_dosage = Column(JSON, default=list, nullable=False)
    critical_warnings = Column(JSON, default=list, nullable=False)
    expiry_date = Column(String, nullable=True)
    low_confidence = Column(Boolean, default=False, nullable=False)
    image_count = Column(Integer, default=1, nullable=False)

    image_filename = Column(String, nullable=True)