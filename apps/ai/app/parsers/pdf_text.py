import re
from dataclasses import dataclass
from typing import BinaryIO
from pypdf import PdfReader
from pypdf.errors import PdfReadError

@dataclass(frozen=True, slots=True)
class PdfTextExtractionResult:
    text: str
    page_count: int
    warnings: list[str]

class PdfTextExtractionError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message

def extract_pdf_text(stream: BinaryIO) -> PdfTextExtractionResult:
    try:
        stream.seek(0)
        reader = PdfReader(stream, strict=False)
    except (PdfReadError, ValueError, OSError) as error:
        raise PdfTextExtractionError('INVALID_PDF', 'Unable to read PDF document') from error

    if reader.is_encrypted:
        raise PdfTextExtractionError('PDF_ENCRYPTED', 'Encrypted PDF documents are not supported')

    if len(reader.pages) == 0:
        raise PdfTextExtractionError('PDF_NO_PAGES', 'PDF document does not contain any pages')

    pages: list[str] = []
    warnings: list[str] = []

    for index, page in enumerate(reader.pages, start=1):
        try:
            page_text = normalize_page_text(page.extract_text() or '')
        except Exception:
            page_text = ''
            warnings.append(f'PAGE_{index}_TEXT_EXTRACTION_FAILED')

        if not page_text:
            warnings.append(f'PAGE_{index}_NO_EXTRACTABLE_TEXT')

        pages.append(page_text)

    text = '\n\n'.join(page for page in pages if page).strip()
    if not text:
        raise PdfTextExtractionError('NO_EXTRACTABLE_TEXT', 'PDF does not contain extractable text')

    return PdfTextExtractionResult(text=text, page_count=len(reader.pages), warnings=warnings)

def normalize_page_text(value: str) -> str:
    value = value.replace('\r\n', '\n').replace('\r', '\n').replace('\u00a0', ' ')
    lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in value.split('\n')]
    normalized: list[str] = []
    previous_blank = False

    for line in lines:
        if not line:
            if not previous_blank and normalized:
                normalized.append('')
            previous_blank = True
            continue

        normalized.append(line)
        previous_blank = False

    return '\n'.join(normalized).strip()