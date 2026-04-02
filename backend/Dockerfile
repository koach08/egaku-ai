FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download GeoLite2-Country database for region detection (JP/KR mosaic enforcement)
RUN curl -sL "https://cdn.jsdelivr.net/npm/geolite2-country/GeoLite2-Country.mmdb.gz" | gunzip > GeoLite2-Country.mmdb

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
