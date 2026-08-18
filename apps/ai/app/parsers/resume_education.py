import re
import unicodedata
from dataclasses import dataclass
from datetime import date
from app.parsers.resume_date import DATE_RANGE_PATTERN, DATE_TOKEN_PATTERN, ParsedDateRange, parse_date_range, parse_date_token

EDUCATION_HEADERS = {
    'education',
    'academic background',
    'academic history',
    'education background',
    'học vấn',
    'giáo dục',
    'trình độ học vấn',
    'quá trình học tập',
}
STOP_HEADERS = {
    'experience',
    'work experience',
    'professional experience',
    'kinh nghiệm',
    'kinh nghiệm làm việc',
    'skills',
    'technical skills',
    'kỹ năng',
    'projects',
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
INSTITUTION_KEYWORDS = (
    'university',
    'college',
    'institute',
    'academy',
    'school',
    'polytechnic',
    'université',
    'đại học',
    'cao đẳng',
    'học viện',
    'trường',
)
DEGREE_KEYWORDS = (
    'bachelor',
    'master',
    'doctor',
    'phd',
    'b.sc',
    'bsc',
    'b.s.',
    'bs',
    'b.a.',
    'ba',
    'm.sc',
    'msc',
    'm.s.',
    'ms',
    'mba',
    'associate',
    'diploma',
    'high school',
    'cử nhân',
    'thạc sĩ',
    'tiến sĩ',
    'kỹ sư',
    'cao đẳng',
    'trung học',
)
GRADUATION_PATTERN = re.compile(
    rf'(?:graduated|graduation|expected graduation|expected|tốt nghiệp|dự kiến tốt nghiệp)\s*:?\s*(?P<date>{DATE_TOKEN_PATTERN})',
    re.IGNORECASE,
)

@dataclass(frozen=True, slots=True)
class EducationDateMarker:
    start_date: date | None
    end_date: date | None
    span_start: int
    span_end: int

@dataclass(frozen=True, slots=True)
class ParsedEducation:
    institution_name: str | None
    degree: str | None
    field_of_study: str | None
    start_date: date | None
    end_date: date | None
    description: str | None
    ordinal: int
    confidence: float

@dataclass(frozen=True, slots=True)
class EducationExtractionResult:
    educations: list[ParsedEducation]
    warnings: list[str]

def extract_resume_educations(text: str) -> EducationExtractionResult:
    section = extract_education_section(text)
    if section is None:
        return EducationExtractionResult(educations=[], warnings=['EDUCATION_SECTION_NOT_FOUND'])

    markers: list[tuple[int, EducationDateMarker]] = []

    for index, line in enumerate(section):
        marker = parse_education_date(line)
        if marker:
            markers.append((index, marker))

    if not markers:
        return EducationExtractionResult(educations=[], warnings=['EDUCATION_DATE_NOT_FOUND'])

    educations: list[ParsedEducation] = []
    warnings: list[str] = []

    for ordinal, (marker_index, marker) in enumerate(markers):
        previous_marker = markers[ordinal - 1][0] if ordinal > 0 else -1
        next_marker = markers[ordinal + 1][0] if ordinal + 1 < len(markers) else len(section)
        block_start = previous_marker + 1
        block_end = next_marker

        institution, degree, field = extract_identity(section, block_start, block_end, marker_index, marker)
        description = extract_description(section, block_start, block_end, marker_index)

        if not institution and not degree and not field:
            warnings.append(f'EDUCATION_{ordinal + 1}_IDENTITY_NOT_FOUND')
        elif not institution:
            warnings.append(f'EDUCATION_{ordinal + 1}_INSTITUTION_NOT_FOUND')

        educations.append(ParsedEducation(
            institution_name=institution,
            degree=degree,
            field_of_study=field,
            start_date=marker.start_date,
            end_date=marker.end_date,
            description=description,
            ordinal=len(educations),
            confidence=calculate_confidence(institution, degree, field),
        ))

    return EducationExtractionResult(educations=educations[:30], warnings=warnings)

def extract_education_section(text: str) -> list[str] | None:
    lines = text.splitlines()
    start: int | None = None

    for index, line in enumerate(lines):
        if normalize_heading(line) in EDUCATION_HEADERS:
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

def parse_education_date(line: str) -> EducationDateMarker | None:
    date_range = parse_date_range(line)

    if date_range:
        return from_date_range(date_range)

    graduation = GRADUATION_PATTERN.search(line)
    if graduation:
        try:
            end_date = parse_date_token(graduation.group('date'), end=True)
        except ValueError:
            return None

        return EducationDateMarker(
            start_date=None,
            end_date=end_date,
            span_start=graduation.start(),
            span_end=graduation.end(),
        )

    stripped = line.strip()
    if not re.fullmatch(DATE_TOKEN_PATTERN, stripped, re.IGNORECASE):
        return None

    try:
        end_date = parse_date_token(stripped, end=True)
    except ValueError:
        return None

    return EducationDateMarker(
        start_date=None,
        end_date=end_date,
        span_start=0,
        span_end=len(line),
    )

def from_date_range(value: ParsedDateRange) -> EducationDateMarker:
    return EducationDateMarker(
        start_date=value.start_date,
        end_date=value.end_date,
        span_start=value.span_start,
        span_end=value.span_end,
    )

def extract_identity(
    lines: list[str],
    start: int,
    end: int,
    marker_index: int,
    marker: EducationDateMarker,
) -> tuple[str | None, str | None, str | None]:
    candidates: list[str] = []
    marker_line = lines[marker_index]
    inline = clean_value(f'{marker_line[:marker.span_start]} {marker_line[marker.span_end:]}')

    if inline:
        candidates.extend(split_identity(inline))

    for index in range(start, end):
        if index == marker_index:
            continue

        value = clean_value(lines[index])
        if not value or is_description_line(value) or parse_education_date(value):
            continue

        candidates.extend(split_identity(value))

    institution = next((value for value in candidates if looks_like_institution(value)), None)
    degree_line = next((value for value in candidates if looks_like_degree(value)), None)
    degree, field = parse_degree_field(degree_line) if degree_line else (None, None)

    if not field:
        field_candidate = next(
            (
                value
                for value in candidates
                if value != institution
                and value != degree_line
                and not looks_like_institution(value)
                and not looks_like_degree(value)
                and len(value) <= 120
            ),
            None,
        )
        field = field_candidate

    return institution, degree, field

def parse_degree_field(value: str) -> tuple[str | None, str | None]:
    cleaned = clean_value(value)
    if not cleaned:
        return None, None

    match = re.search(r'\s+(?:in)\s+', cleaned, re.IGNORECASE)
    if match:
        return clean_value(cleaned[:match.start()]), clean_value(cleaned[match.end():])

    match = re.search(r'\s*(?:-|–|—|,)?\s*chuyên\s+ngành\s*:?\s*', cleaned, re.IGNORECASE)
    if match:
        return clean_value(cleaned[:match.start()]), clean_value(cleaned[match.end():])

    prefixes = (
        r'bachelor(?:\s+of\s+(?:science|arts|engineering))?',
        r'master(?:\s+of\s+(?:science|arts|engineering))?',
        r'doctor(?:\s+of\s+philosophy)?',
        r'ph\.?d\.?',
        r'b\.?\s?sc\.?',
        r'b\.?\s?s\.?',
        r'b\.?\s?a\.?',
        r'm\.?\s?sc\.?',
        r'm\.?\s?s\.?',
        r'mba',
        r'associate(?:\s+degree)?',
        r'diploma',
        r'cử nhân',
        r'thạc sĩ',
        r'tiến sĩ',
        r'kỹ sư',
    )

    for prefix in prefixes:
        match = re.match(rf'^({prefix})(?:\s+of)?\s*(.*)$', cleaned, re.IGNORECASE)
        if match:
            degree = clean_value(match.group(1))
            field = clean_value(match.group(2)) or None
            return degree, field

    return cleaned, None

def split_identity(value: str) -> list[str]:
    parts = re.split(r'\s*[|]\s*|\s+@\s+|\s+-\s+', value, flags=re.IGNORECASE)
    return [clean_value(part) for part in parts if clean_value(part)]

def extract_description(lines: list[str], start: int, end: int, marker_index: int) -> str | None:
    values: list[str] = []

    for index in range(start, end):
        if index == marker_index:
            continue

        value = lines[index].strip()
        if not value or not is_description_line(value):
            continue

        cleaned = re.sub(r'^[\s•●▪◦‣\-–—*]+', '', value).strip()
        if cleaned:
            values.append(cleaned)

    return '\n'.join(values)[:4000] if values else None

def is_description_line(value: str) -> bool:
    normalized = normalize_text(value)

    if re.match(r'^[•●▪◦‣\-–—*]', value):
        return True

    return normalized.startswith((
        'gpa',
        'grade',
        'honor',
        'honour',
        'coursework',
        'relevant coursework',
        'classification',
        'xếp loại',
        'điểm',
        'gpa:',
    ))

def looks_like_institution(value: str) -> bool:
    normalized = normalize_text(value)
    return any(keyword in normalized for keyword in INSTITUTION_KEYWORDS)

def looks_like_degree(value: str) -> bool:
    normalized = normalize_text(value)
    return any(keyword in normalized for keyword in DEGREE_KEYWORDS)

def calculate_confidence(institution: str | None, degree: str | None, field: str | None) -> float:
    if institution and degree and field:
        return 0.95
    if institution and degree:
        return 0.90
    if institution:
        return 0.80
    if degree or field:
        return 0.75
    return 0.65

def clean_value(value: str) -> str:
    return re.sub(r'\s+', ' ', value).strip(' \t-|,@')

def normalize_text(value: str) -> str:
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', value).strip().lower())

def normalize_heading(value: str) -> str:
    normalized = unicodedata.normalize('NFKC', value).strip().lower()
    return re.sub(r'[_\W]+', ' ', normalized, flags=re.UNICODE).strip()