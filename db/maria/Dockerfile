FROM mariadb:10.4

ENV MYSQL_ROOT_PASSWORD=password

WORKDIR /app

COPY ./init.sh /docker-entrypoint-initdb.d
COPY ./seed.sql ./scripts/seed.sql
COPY ./my.cnf /etc/mysql/my.cnf