from fastapi import APIRouter
from app.api.resume_skills import router as resume_skills_router
from app.api.resume_text import router as resume_text_router

router = APIRouter(prefix='/v1')
router.include_router(resume_text_router)
router.include_router(resume_skills_router)