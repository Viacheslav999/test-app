
FROM python:3.12-slim

WORKDIR /app

# Устанавливаем зависимости
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Копируем приложение
COPY app /app/app

ENV PYTHONUNBUFFERED=1

# Запуск FastAPI + Socket.IO
CMD ["uvicorn", "app.main:asgi_app", "--host", "0.0.0.0", "--port", "8000"]
