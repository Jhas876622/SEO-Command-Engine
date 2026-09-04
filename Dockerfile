FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies file
COPY requirements.txt .

# Install Python requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose live dashboard port
EXPOSE 7700

# Set environment variables
ENV SEO_PORT=7700
ENV PYTHONUNBUFFERED=1

# Command to run the dashboard server and MCP background tools
CMD ["python", "mcp/server.py"]
