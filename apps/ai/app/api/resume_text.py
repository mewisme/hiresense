from fastapi import APIRouter, File, HTTPException, UploadFile, status
from app.parsers.pdf_text import PdfTextExtractionError, extract_pdf_text
from app.schemas.resume_text import ResumeTextExtractionResponse

router = APIRouter(prefix='/resume', tags=['resume'])

@router.post('/extract-text', response_model=ResumeTextExtractionResponse)
def extract_resume_text(file: UploadFile = File(...)) -> ResumeTextExtractionResponse:
    file.file.seek(0)
    header = file.file.read(5)
    file.file.seek(0)

    if header != b'%PDF-':
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={'code': 'INVALID_PDF_HEADER', 'message': 'Uploaded file is not a valid PDF'},
        )

    try:
        result = extract_pdf_text(file.file)
    except PdfTextExtractionError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={'code': error.code, 'message': error.message},
        ) from error

    return ResumeTextExtractionResponse(
        text=result.text,
        page_count=result.page_count,
        text_length=len(result.text),
        warnings=result.warnings,
    )