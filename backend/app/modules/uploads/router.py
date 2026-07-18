import mimetypes
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.api.responses import envelope
from app.core.security import require_roles

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads" / "images"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 10


@router.post("/images", dependencies=[Depends(require_roles("admin", "vendor"))])
async def upload_image(file: UploadFile = File(...)) -> dict:
    """Upload a product image and return its public URL."""
    content_type = file.content_type or ""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{content_type}'. Allowed: JPEG, PNG, WebP, GIF.",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_SIZE_MB} MB limit.")

    ext = mimetypes.guess_extension(content_type) or ".jpg"
    # Normalize common extension variants
    ext = {".jpe": ".jpg", ".jpeg": ".jpg"}.get(ext, ext)
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / filename
    dest.write_bytes(contents)

    return envelope({"url": f"/uploads/images/{filename}", "filename": filename})


@router.get("/images/{filename}")
async def serve_image(filename: str) -> FileResponse:
    """Serve an uploaded image file."""
    # Sanitize filename — no path traversal
    safe_name = Path(filename).name
    path = UPLOAD_DIR / safe_name
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found.")
    return FileResponse(path)
