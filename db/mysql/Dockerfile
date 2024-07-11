FROM mysql:8.1

ENV MYSQL_ROOT_PASSWORD=password

WORKDIR /app

COPY ./init.sh /docker-entrypoint-initdb.d
COPY ./seed.sql ./scripts/seed.sql
COPY ./my.cnf /etc/my.cnf