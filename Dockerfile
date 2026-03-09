# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for compiling certain python packages like psycopg2, spacy, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to leverage Docker cache
COPY backend/requirements.txt ./backend/requirements.txt

# Create virtual env and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the rest of the backend codebase
COPY backend/ ./backend/

# Set the working directory to the backend folder so uvicorn can find main.py
WORKDIR /app/backend

# Expose port (Railway will map this automatically)
EXPOSE 8000

# Start application properly wrapping var execution
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
