# Stage 1: Build the React app
FROM node:14 AS react-build
WORKDIR /app
COPY ./react-app ./
RUN npm install
RUN npm install typescript@5.6.3
RUN npm install --save @fortawesome/fontawesome-free
RUN npm run build

# Stage 2: Set up the Django app
FROM python:3.10.12
ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH=/app/djangoapp

# Install Nginx
RUN apt-get update && apt-get install -y nginx redis-server redis-tools

# Create app directory
WORKDIR /app

# Copy Django app
COPY ./djangoapp ./djangoapp

# Copy React build files to be served by Django
COPY --from=react-build /app/build ./djangoapp/static/
RUN chown -R www-data:www-data /app/djangoapp/static
RUN chmod -R 755 /app/djangoapp/static

# Install dependencies
RUN pip install --upgrade pip
RUN pip install --verbose -r ./djangoapp/requirements.txt

# Copy Gunicorn config and service file
COPY ./gunicorn/gunicorn.service /etc/systemd/system/gunicorn.service
RUN mkdir -p /var/log/gunicorn && chown -R www-data:www-data /var/log/gunicorn && chmod -R 755 /var/log/gunicorn

# Copy Nginx config
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/bookrank /etc/nginx/sites-available/bookrank
RUN sed -i 's|/home/ryanbrown/projects/bookrank||g' /etc/nginx/sites-available/bookrank
RUN mkdir -p /etc/nginx/sites-enabled && ln -s /etc/nginx/sites-available/bookrank /etc/nginx/sites-enabled/bookrank
COPY ./nginx/mime.types /etc/nginx/mime.types

# Collect static files
RUN python ./djangoapp/manage.py collectstatic --noinput

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 8000

# Command to start Gunicorn and Nginx
# CMD ["sh", "-c", "export PYTHONPATH=/app/djangoapp:/app && cd djangoapp && gunicorn djangoapp.wsgi:application --bind 0.0.0.0:8000 & nginx -g 'daemon off;'"]

# Use entrypoint script to start services
ENTRYPOINT ["/app/entrypoint.sh"]