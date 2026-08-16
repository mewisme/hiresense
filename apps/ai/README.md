# HireSense AI Service

FastAPI service for CV parsing, job-description parsing, and CV–JD matching. Called by the NestJS API (`AI_SERVICE_URL`), which owns persistence — this service stays stateless.

## Stack

- Python 3.14, managed with [uv](https://docs.astral.sh/uv/)
- FastAPI + Pydantic

## Layout

```text
app/
├── main.py         # FastAPI app, /health endpoint
├── api/            # HTTP routes
├── parsers/        # CV / JD text extraction and structured parsing
├── matching/       # scoring engine (skill / experience / education)
└── embeddings/     # embedding adapters for the semantic phase
```

## Commands

```bash
uv sync                                              # install dependencies
uv run uvicorn app.main:app --reload --port 8000     # dev server on http://localhost:8000
uv run pytest                                        # tests
```

Every AI result is produced by a versioned pipeline (see `ai_pipeline_versions` in [`../../docs/DATABASE.md`](../../docs/DATABASE.md)) so outputs stay reproducible per CV version, JD version, and pipeline version.
