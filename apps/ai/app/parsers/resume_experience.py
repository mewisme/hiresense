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

EXPERIENCE_HEADERS = {
    'experience',
    'work experience',
    'professional experience',
    'employment history',
    'work history',
    'career history',
    'kinh nghiệm',
    'kinh nghiệm làm việc',
    'quá trình công tác',
}

STOP_HEADERS = {
    'education',
    'academic background',
    'học vấn',
    'skills',
    'technical skills',
    'kỹ năng',
    'projects',
    'personal projects',
    'dự án',
    'certifications',
    'certificates',
    'chứng chỉ',
    'languages',
    'ngôn ngữ',
    'awards',
    'achievements',
    'summary',
    'objective',
}

JOB_TITLE_KEYWORDS = (
    'engineer',
    'developer',
    'intern',
    'manager',
    'lead',
    'architect',
    'analyst',
    'consultant',
    'specialist',
    'designer',
    'administrator',
    'director',
    'officer',
    'scientist',
    'researcher',
    'tester',
    'qa',
    'devops',
    'backend',
    'frontend',
    'full stack',
    'fullstack',
    'software',
    'kỹ sư',
    'lập trình',
    'thực tập',
    'quản lý',
    'trưởng',
    'chuyên viên',
)

@dataclass(frozen=True, slots=True)
class ParsedDateRange:
    start_date: date
    end_date: date | None
    is_current: bool
    span_start: int
    span_end: int

@dataclass(frozen=True, slots=True)
class ParsedExperience:
    company_name: str | None
    job_title: str | None
    start_date: date
    end_date: date | None
    is_current: bool
    description: str | None
    experience_months: int
    ordinal: int
    confidence: float

@dataclass(frozen=True, slots=True)
class ExperienceExtractionResult:
    experiences: list[ParsedExperience]
    warnings: list[str]

def extract_resume_experiences(text: str, reference_date: date) -> ExperienceExtractionResult:
    section = extract_experience_section(text)
    if section is None:
        return ExperienceExtractionResult(experiences=[], warnings=['EXPERIENCE_SECTION_NOT_FOUND'])

    markers: list[tuple[int, ParsedDateRange]] = []
    warnings: list[str] = []

    for index, line in enumerate(section):
        date_range = parse_date_range(line, reference_date)
        if date_range:
            markers.append((index, date_range))

    if not markers:
        return ExperienceExtractionResult(experiences=[], warnings=['EXPERIENCE_DATE_RANGE_NOT_FOUND'])

    experiences: list[ParsedExperience] = []

    for ordinal, (index, date_range) in enumerate(markers):
        previous_marker = markers[ordinal - 1][0] if ordinal > 0 else -1
        next_marker = markers[ordinal + 1][0] if ordinal + 1 < len(markers) else len(section)

        job_title, company_name = extract_identity(
            section,
            index,
            previous_marker,
            date_range,
        )

        description = extract_description(section, index + 1, next_marker)

        effective_end = reference_date if date_range.is_current else date_range.end_date
        if effective_end is None or effective_end < date_range.start_date:
            warnings.append(f'EXPERIENCE_{ordinal + 1}_INVALID_DATE_RANGE')
            continue

        confidence = calculate_confidence(job_title, company_name)

        if not job_title and not company_name:
            warnings.append(f'EXPERIENCE_{ordinal + 1}_IDENTITY_NOT_FOUND')

        experiences.append(ParsedExperience(
            company_name=company_name,
            job_title=job_title,
            start_date=date_range.start_date,
            end_date=date_range.end_date,
            is_current=date_range.is_current,
            description=description,
            experience_months=calculate_experience_months(date_range.start_date, effective_end),
            ordinal=len(experiences),
            confidence=confidence,
        ))

    return ExperienceExtractionResult(experiences=experiences[:50], warnings=warnings)

def extract_experience_section(text: str) -> list[str] | None:
    lines = text.splitlines()
    start: int | None = None

    for index, line in enumerate(lines):
        if normalize_heading(line) in EXPERIENCE_HEADERS:
            start = index + 1
            break

    if start is None:
        return None

    end = len(lines)

    for index in range(start, len(lines)):
        if normalize_heading(lines[index]) in STOP_HEADERS:
            end = index
            break

    return lines[start:end]

def parse_date_range(line: str, reference_date: date) -> ParsedDateRange | None:
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

    if is_current and start_date > reference_date:
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
        month = MONTHS[match.group(1).lower()]
        return date(int(match.group(2)), month, 1)

    match = re.fullmatch(r'(\d{4})', normalized)
    if match:
        return date(int(match.group(1)), 12 if end else 1, 1)

    raise ValueError(f'Unsupported date token: {value}')

def extract_identity(
    lines: list[str],
    marker_index: int,
    previous_marker: int,
    date_range: ParsedDateRange,
) -> tuple[str | None, str | None]:
    inline_prefix = clean_identity_value(lines[marker_index][:date_range.span_start])

    if inline_prefix:
        inline_parts = split_identity(inline_prefix)
        if inline_parts:
            return assign_identity(inline_parts)

    candidates: list[str] = []
    lower_bound = max(previous_marker + 1, marker_index - 4)

    for index in range(marker_index - 1, lower_bound - 1, -1):
        candidate = clean_identity_value(lines[index])

        if not candidate:
            if candidates:
                break
            continue

        if not is_identity_candidate(candidate):
            continue

        candidates.append(candidate)

        if len(candidates) == 2:
            break

    candidates.reverse()
    return assign_identity(candidates)

def split_identity(value: str) -> list[str]:
    parts = re.split(r'\s*[|]\s*|\s+@\s+|\s+at\s+|\s+-\s+', value, flags=re.IGNORECASE)
    return [clean_identity_value(part) for part in parts if clean_identity_value(part)]

def assign_identity(parts: list[str]) -> tuple[str | None, str | None]:
    if not parts:
        return None, None

    if len(parts) == 1:
        value = parts[0]
        return (value, None) if looks_like_job_title(value) else (None, value)

    first, second = parts[-2], parts[-1]
    first_is_title = looks_like_job_title(first)
    second_is_title = looks_like_job_title(second)

    if first_is_title and not second_is_title:
        return first, second

    if second_is_title and not first_is_title:
        return second, first

    return first, second

def extract_description(lines: list[str], start: int, end: int) -> str | None:
    values: list[str] = []

    for line in lines[start:end]:
        stripped = line.strip()
        if not stripped:
            continue

        if is_description_line(stripped):
            value = re.sub(r'^[\s•●▪◦‣\-–—*]+', '', stripped).strip()
            if value:
                values.append(value)

    if not values:
        return None

    return '\n'.join(values)[:4000]

def is_description_line(value: str) -> bool:
    if re.match(r'^[•●▪◦‣\-–—*]', value):
        return True
    if len(value) >= 80:
        return True
    return len(value) >= 40 and value.endswith(('.', ';'))

def is_identity_candidate(value: str) -> bool:
    if len(value) > 120:
        return False
    if re.match(r'^[•●▪◦‣\-–—*]', value):
        return False
    if DATE_RANGE_PATTERN.search(value):
        return False
    return normalize_heading(value) not in STOP_HEADERS

def looks_like_job_title(value: str) -> bool:
    normalized = normalize_text(value)
    return any(keyword in normalized for keyword in JOB_TITLE_KEYWORDS)

def calculate_experience_months(start: date, end: date) -> int:
    return max(0, (end.year - start.year) * 12 + end.month - start.month + 1)

def calculate_confidence(job_title: str | None, company_name: str | None) -> float:
    if job_title and company_name:
        return 0.95
    if job_title or company_name:
        return 0.85
    return 0.75

def is_current_token(value: str) -> bool:
    return re.fullmatch(CURRENT_PATTERN, normalize_text(value), re.IGNORECASE) is not None

def clean_identity_value(value: str) -> str:
    return re.sub(r'\s+', ' ', value).strip(' \t-|,@')

def normalize_text(value: str) -> str:
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', value).strip().lower())

def normalize_heading(value: str) -> str:
    normalized = unicodedata.normalize('NFKC', value).strip().lower()
    return re.sub(r'[_\W]+', ' ', normalized, flags=re.UNICODE).strip()