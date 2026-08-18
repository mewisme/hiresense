from fastapi import APIRouter
from app.api.resume_educations import router as resume_educations_router
from app.api.resume_experiences import router as resume_experiences_router
from app.api.resume_skills import router as resume_skills_router
from app.api.resume_text import router as resume_text_router

router = APIRouter(prefix='/v1')
router.include_router(resume_text_router)
router.include_router(resume_skills_router)
router.include_router(resume_experiences_router)
router.include_router(resume_educations_router)