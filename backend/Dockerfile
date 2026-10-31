# ==============================================================================
# PlateWise AI — Secure Backend Dockerfile
# Follows OWASP & ASVS: Unprivileged non-root user, minimal attack surface
# ==============================================================================
FROM python:3.12-slim-bookworm AS base

# Prevent Python from writing .pyc files & buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install security updates and build-essential if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged user with explicit UID and GID (ASVS L2)
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /sbin/nologin -d /app appuser

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code with proper non-root permissions
COPY --chown=appuser:appgroup . .

# Set working permissions
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Switch to unprivileged non-root user
USER appuser

EXPOSE 8000

# Healthcheck to ensure container responsiveness
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
