#!/bin/bash

# Start Redis server
redis-server &
sleep 5

# Start Celery worker
celery -A djangoapp worker --loglevel=info -P solo --without-gossip --concurrency 1 &

# Python path and cd
export PYTHONPATH=/app/djangoapp:/app && cd djangoapp

# Start Gunicorn
gunicorn djangoapp.wsgi:application --bind 0.0.0.0:8000 &

# Start Nginx
nginx -g 'daemon off;'
