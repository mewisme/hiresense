import re
import unicodedata
from dataclasses import dataclass

@dataclass(frozen=True, slots=True)
class SkillDictionaryEntry:
    id: str
    name: str
    normalized_name: str

@dataclass(frozen=True, slots=True)
class SkillAliasEntry:
    skill_id: str
    alias: str

@dataclass(frozen=True, slots=True)
class SkillDictionaryMatch:
    skill_id: str
    matched_text: str
    evidence_text: str
    confidence: float

def extract_skill_dictionary_matches(
    text: str,
    skills: list[SkillDictionaryEntry],
    aliases: list[SkillAliasEntry],
) -> list[SkillDictionaryMatch]:
    lines = [(line.strip(), normalize_match_text(line)) for line in text.splitlines() if line.strip()]
    aliases_by_skill: dict[str, list[str]] = {}

    for alias in aliases:
        aliases_by_skill.setdefault(alias.skill_id, []).append(alias.alias)

    matches: list[SkillDictionaryMatch] = []

    for skill in skills:
        canonical = find_first_match(lines, skill.normalized_name or skill.name)

        if canonical:
            matches.append(SkillDictionaryMatch(
                skill_id=skill.id,
                matched_text=skill.name,
                evidence_text=truncate_evidence(canonical),
                confidence=1.0,
            ))
            continue

        for alias in aliases_by_skill.get(skill.id, []):
            evidence = find_first_match(lines, alias)
            if not evidence:
                continue

            matches.append(SkillDictionaryMatch(
                skill_id=skill.id,
                matched_text=alias,
                evidence_text=truncate_evidence(evidence),
                confidence=0.95,
            ))
            break

    return matches

def find_first_match(lines: list[tuple[str, str]], term: str) -> str | None:
    normalized_term = normalize_match_text(term)
    if not normalized_term:
        return None

    pattern = build_skill_pattern(normalized_term)

    for raw_line, normalized_line in lines:
        if pattern.search(normalized_line):
            return raw_line

    return None

def normalize_match_text(value: str) -> str:
    normalized = unicodedata.normalize('NFKC', value).strip().lower()
    return re.sub(r'\s+', ' ', normalized)

def build_skill_pattern(term: str) -> re.Pattern[str]:
    parts = [re.escape(part) for part in term.split(' ') if part]
    body = r'\s+'.join(parts)

    prefix = r'(?<![\w.])' if term[0].isalnum() or term[0] == '_' else ''
    suffix = r'(?![\w.])' if term[-1].isalnum() or term[-1] == '_' else ''

    return re.compile(f'{prefix}{body}{suffix}')

def truncate_evidence(value: str, max_length: int = 500) -> str:
    if len(value) <= max_length:
        return value
    return f'{value[:max_length - 3].rstrip()}...'