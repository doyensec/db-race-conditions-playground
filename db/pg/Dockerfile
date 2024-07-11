FROM postgres:latest

ENV POSTGRES_PASSWORD=postgres

WORKDIR /app

COPY ./init.sh /docker-entrypoint-initdb.d
COPY ./seed.sql ./scripts/seed.sql