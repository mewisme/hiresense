import re
import unicodedata
from dataclasses import dataclass

@dataclass(frozen=True, slots=True)
class SkillDictionaryEntry:
    id: str
    name: str
    normalized_name: str

@dataclass(frozen=True, slots=True)
class SkillDictionaryMatch:
    skill_id: str
    matched_text: str
    evidence_text: str
    confidence: float

def extract_skill_dictionary_matches(text: str, skills: list[SkillDictionaryEntry]) -> list[SkillDictionaryMatch]:
    matches: list[SkillDictionaryMatch] = []
    seen: set[str] = set()

    for raw_line in text.splitlines():
        evidence = raw_line.strip()
        if not evidence:
            continue

        normalized_line = normalize_match_text(evidence)

        for skill in skills:
            if skill.id in seen:
                continue

            term = normalize_match_text(skill.normalized_name or skill.name)
            if not term:
                continue

            pattern = build_skill_pattern(term)
            if not pattern.search(normalized_line):
                continue

            seen.add(skill.id)
            matches.append(SkillDictionaryMatch(
                skill_id=skill.id,
                matched_text=skill.name,
                evidence_text=truncate_evidence(evidence),
                confidence=1.0,
            ))

    return matches

def normalize_match_text(value: str) -> str:
    normalized = unicodedata.normalize('NFKC', value).strip().lower()
    return re.sub(r'\s+', ' ', normalized)

def build_skill_pattern(term: str) -> re.Pattern[str]:
    parts = [re.escape(part) for part in term.split(' ') if part]
    body = r'\s+'.join(parts)

    prefix = r'(?<!\w)' if term[0].isalnum() or term[0] == '_' else ''
    suffix = r'(?!\w)' if term[-1].isalnum() or term[-1] == '_' else ''

    return re.compile(f'{prefix}{body}{suffix}')

def truncate_evidence(value: str, max_length: int = 500) -> str:
    if len(value) <= max_length:
        return value
    return f'{value[:max_length - 3].rstrip()}...'