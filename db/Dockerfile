FROM postgres:17-alpine
COPY init/ /docker-entrypoint-initdb.d/
COPY roles.sql /db/roles.sql
USER postgres
