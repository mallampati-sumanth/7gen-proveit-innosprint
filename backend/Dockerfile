FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (including git for repo cloning)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY model /app/model
COPY backend /app/backend

RUN pip install --no-cache-dir -r /app/backend/requirements.txt
RUN pip install --no-cache-dir -e /app/model

ENV PYTHONPATH=/app
EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
