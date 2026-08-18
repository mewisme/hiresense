import re
import unicodedata
from dataclasses import dataclass
from datetime import date

MONTHS = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'sept': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12,
}
MONTH_NAME_PATTERN = r'(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
NUMERIC_MONTH_YEAR_PATTERN = r'(?:0?[1-9]|1[0-2])[/.-]\d{4}'
ISO_MONTH_PATTERN = r'\d{4}[/.-](?:0?[1-9]|1[0-2])'
VI_MONTH_PATTERN = r'tháng\s+(?:0?[1-9]|1[0-2])(?:\s*[/.-]\s*|\s+)\d{4}'
DATE_TOKEN_PATTERN = rf'(?:{MONTH_NAME_PATTERN}\s+\d{{4}}|{NUMERIC_MONTH_YEAR_PATTERN}|{ISO_MONTH_PATTERN}|{VI_MONTH_PATTERN}|\d{{4}})'
CURRENT_PATTERN = r'(?:present|current|now|hiện\s+tại|nay)'
DATE_RANGE_PATTERN = re.compile(
    rf'(?P<start>{DATE_TOKEN_PATTERN})\s*(?:-|–|—|to|đến|tới)\s*(?P<end>{DATE_TOKEN_PATTERN}|{CURRENT_PATTERN})',
    re.IGNORECASE,
)

@dataclass(frozen=True, slots=True)
class ParsedDateRange:
    start_date: date
    end_date: date | None
    is_current: bool
    span_start: int
    span_end: int

def parse_date_range(line: str, reference_date: date | None = None) -> ParsedDateRange | None:
    match = DATE_RANGE_PATTERN.search(line)
    if not match:
        return None

    try:
        start_date = parse_date_token(match.group('start'), end=False)
        end_token = match.group('end')
        is_current = is_current_token(end_token)
        end_date = None if is_current else parse_date_token(end_token, end=True)
    except ValueError:
        return None

    if is_current and reference_date is not None and start_date > reference_date:
        return None
    if not is_current and end_date is not None and end_date < start_date:
        return None

    return ParsedDateRange(
        start_date=start_date,
        end_date=end_date,
        is_current=is_current,
        span_start=match.start(),
        span_end=match.end(),
    )

def parse_date_token(value: str, end: bool) -> date:
    normalized = normalize_text(value)

    match = re.fullmatch(r'(\d{4})[/.-](\d{1,2})', normalized)
    if match:
        return date(int(match.group(1)), int(match.group(2)), 1)

    match = re.fullmatch(r'(\d{1,2})[/.-](\d{4})', normalized)
    if match:
        return date(int(match.group(2)), int(match.group(1)), 1)

    match = re.fullmatch(r'tháng\s+(\d{1,2})(?:\s*[/.-]\s*|\s+)(\d{4})', normalized)
    if match:
        return date(int(match.group(2)), int(match.group(1)), 1)

    match = re.fullmatch(rf'({MONTH_NAME_PATTERN})\s+(\d{{4}})', normalized, re.IGNORECASE)
    if match:
        return date(int(match.group(2)), MONTHS[match.group(1).lower()], 1)

    match = re.fullmatch(r'(\d{4})', normalized)
    if match:
        return date(int(match.group(1)), 12 if end else 1, 1)

    raise ValueError(f'Unsupported date token: {value}')

def is_current_token(value: str) -> bool:
    return re.fullmatch(CURRENT_PATTERN, normalize_text(value), re.IGNORECASE) is not None

def normalize_text(value: str) -> str:
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', value).strip().lower())