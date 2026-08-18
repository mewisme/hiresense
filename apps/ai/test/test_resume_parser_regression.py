from datetime import date
from unittest import TestCase
from app.parsers.resume_education import extract_resume_educations
from app.parsers.resume_experience import extract_resume_experiences
from app.parsers.skill_dictionary import SkillAliasEntry, SkillDictionaryEntry, extract_skill_dictionary_matches

SKILLS = [
    SkillDictionaryEntry(id='typescript', name='TypeScript', normalized_name='typescript'),
    SkillDictionaryEntry(id='nestjs', name='NestJS', normalized_name='nestjs'),
    SkillDictionaryEntry(id='postgresql', name='PostgreSQL', normalized_name='postgresql'),
    SkillDictionaryEntry(id='docker', name='Docker', normalized_name='docker'),
]
ALIASES = [
    SkillAliasEntry(skill_id='typescript', alias='ts'),
    SkillAliasEntry(skill_id='nestjs', alias='nest js'),
    SkillAliasEntry(skill_id='postgresql', alias='postgres'),
]

CASES = [
    (
        'english-full',
        'WORK EXPERIENCE\nBackend Developer\nABC Corp\nJan 2023 - Present\n- Built APIs with NestJS and TypeScript.\n\nEDUCATION\nExample University\nBachelor of Science in Computer Science\n2018 - 2022',
        1, 1, {'typescript', 'nestjs'},
    ),
    (
        'vietnamese-full',
        'KINH NGHIỆM LÀM VIỆC\nLập trình viên Backend\nCông ty ABC\nTháng 1/2023 - Hiện tại\n- Sử dụng Postgres và Docker.\n\nHỌC VẤN\nĐại học Bách Khoa\nKỹ sư - Chuyên ngành Công nghệ thông tin\n2018 - 2023',
        1, 1, {'postgresql', 'docker'},
    ),
    (
        'multiple-jobs',
        'EXPERIENCE\nSoftware Engineer\nCompany A\nJan 2020 - Dec 2021\nBackend Developer\nCompany B\nJan 2022 - Present\nEDUCATION\nUniversity A\n2016 - 2020',
        2, 1, set(),
    ),
    (
        'inline-job',
        'EXPERIENCE\nSoftware Engineer | Example Corp | Jun 2021 - Dec 2022\nEDUCATION\nExample University\n2017 - 2021',
        1, 1, set(),
    ),
    (
        'year-only',
        'EXPERIENCE\nBackend Developer\nABC Corp\n2022 - 2024\nEDUCATION\nUniversity A\n2018 - 2022',
        1, 1, set(),
    ),
    (
        'month-year',
        'EXPERIENCE\nBackend Developer\nABC Corp\n01/2022 - 08/2024\nEDUCATION\nUniversity A\n2018 - 2022',
        1, 1, set(),
    ),
    (
        'no-experience',
        'EDUCATION\nExample University\nBachelor of Science in Computer Science\n2018 - 2022',
        0, 1, set(),
    ),
    (
        'no-education',
        'EXPERIENCE\nBackend Developer\nABC Corp\n2022 - Present',
        1, 0, set(),
    ),
    (
        'project-dates-ignored',
        'PROJECTS\nHireSense\n2024 - 2025\nBuilt with TypeScript.\nEDUCATION\nExample University\n2018 - 2022',
        0, 1, {'typescript'},
    ),
    (
        'graduation-only',
        'EDUCATION\nExample University\nBachelor of Computer Science\nExpected Graduation: Jun 2027',
        0, 1, set(),
    ),
    (
        'skill-aliases',
        'SKILLS\nTS, Nest JS, Postgres, Docker',
        0, 0, {'typescript', 'nestjs', 'postgresql', 'docker'},
    ),
    (
        'empty-structured-sections',
        'SUMMARY\nBackend engineer focused on distributed systems.',
        0, 0, set(),
    ),
]

class ResumeParserRegressionTests(TestCase):
    def test_regression_cases(self):
        for name, text, expected_experiences, expected_educations, expected_skills in CASES:
            with self.subTest(name=name):
                experience = extract_resume_experiences(text, date(2026, 8, 18))
                education = extract_resume_educations(text)
                skills = extract_skill_dictionary_matches(text, SKILLS, ALIASES)

                self.assertEqual(len(experience.experiences), expected_experiences)
                self.assertEqual(len(education.educations), expected_educations)
                self.assertEqual({skill.skill_id for skill in skills}, expected_skills)

    def test_skill_boundaries(self):
        cases = [
            ('TypeScript.', {'typescript'}),
            ('Docker.', {'docker'}),
            ('NestJS, TypeScript, Docker.', {'nestjs', 'typescript', 'docker'}),
            ('next.js', set()),
            ('vue.js', set()),
        ]

        for text, expected in cases:
            with self.subTest(text=text):
                skills = extract_skill_dictionary_matches(text, SKILLS, ALIASES)
                self.assertEqual({skill.skill_id for skill in skills}, expected)                