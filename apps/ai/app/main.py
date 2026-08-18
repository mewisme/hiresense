from fastapi import FastAPI
from app.api.router import router

app = FastAPI(title='HireSense AI', version='0.1.0')
app.include_router(router)

@app.get('/health')
async def health() -> dict[str, str]:
    return {'status': 'ok'}