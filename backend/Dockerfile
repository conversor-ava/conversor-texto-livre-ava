FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml /app/
RUN pip install -e . 

COPY app ./app
COPY alembic.ini ./
COPY alembic ./alembic

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]