from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import MedicationScan
from ..schemas import ScanResponse, ScansResponse
from ..security import verify_passcode

router = APIRouter(tags=["scans"])


@router.get("/scans", response_model=ScansResponse)
def list_scans(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> ScansResponse:
    query = db.query(MedicationScan).order_by(MedicationScan.created_at.desc())
    total = query.count()
    records = query.offset(offset).limit(limit).all()
    return ScansResponse(
        count=total,
        items=[ScanResponse.model_validate(record) for record in records],
    )


@router.delete("/scans", status_code=204, dependencies=[Depends(verify_passcode)])
def clear_scans(db: Session = Depends(get_db)) -> Response:
    db.query(MedicationScan).delete()
    db.commit()
    return Response(status_code=204)


@router.get("/scans/{scan_id}", response_model=ScanResponse)
def get_scan(scan_id: int, db: Session = Depends(get_db)) -> ScanResponse:
    record = db.get(MedicationScan, scan_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return ScanResponse.model_validate(record)


@router.delete("/scans/{scan_id}", status_code=204)
def delete_scan(scan_id: int, db: Session = Depends(get_db)) -> Response:
    record = db.get(MedicationScan, scan_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Scan not found.")
    db.delete(record)
    db.commit()
    return Response(status_code=204)