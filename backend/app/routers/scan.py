import io
import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..gemini_client import analyze_image_with_gemini, translate_to_hindi
from ..models import MedicationScan
from ..schemas import MedicationDetails, ScanResponse
from ..security import verify_passcode

router = APIRouter(tags=["scan"])


def _validate_image(data: bytes, content_type: str | None) -> str:
    if content_type and not (
        content_type.startswith("image/") or content_type == "application/octet-stream"
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file (JPEG, PNG, or WebP).",
        )

    mime = content_type or "image/jpeg"

    if not data:
        raise HTTPException(status_code=400, detail="One of the uploaded images is empty.")
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Each image must be under {settings.max_upload_mb} MB.",
        )

    try:
        with Image.open(io.BytesIO(data)) as img:
            img.load()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail="We could not read one of the images. Please try clearer photos of the label.",
        ) from exc

    return mime


@router.post("/scan-medicine", response_model=ScanResponse, dependencies=[Depends(verify_passcode)])
async def scan_medicine(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
) -> ScanResponse:
    if len(files) > settings.max_images:
        raise HTTPException(
            status_code=400,
            detail=f"You can upload up to {settings.max_images} photos in one scan.",
        )

    images: list[tuple[bytes, str]] = []
    filenames: list[str] = []

    for file in files:
        image_bytes = await file.read()
        mime = _validate_image(image_bytes, file.content_type)
        images.append((image_bytes, mime))
        if file.filename:
            filenames.append(file.filename)

    try:
        verdict = analyze_image_with_gemini(images)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=422,
            detail="We could not read the medicine label clearly. Please retake the photo with better lighting.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Something went wrong talking to Gemini: {exc}",
        ) from exc

    record = MedicationScan(
        medication_name=verdict.get("medication_name") or "Unknown medicine",
        drug_name=verdict.get("drug_name"),
        purpose=verdict.get("purpose"),
        intake_dosage=verdict.get("intake_dosage", []),
        critical_warnings=verdict.get("critical_warnings", []),
        expiry_date=verdict.get("expiry_date"),
        low_confidence=bool(verdict.get("low_confidence", False)),
        image_count=len(images),
        image_filename=", ".join(filenames) if filenames else None,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return ScanResponse.model_validate(record)


@router.post("/translate", response_model=MedicationDetails, dependencies=[Depends(verify_passcode)])
async def translate_details(details: MedicationDetails) -> MedicationDetails:
    try:
        translated = translate_to_hindi(details.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=422,
            detail="Translation failed. Please try again.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Something went wrong talking to Gemini: {exc}",
        ) from exc

    return MedicationDetails.model_validate(translated)