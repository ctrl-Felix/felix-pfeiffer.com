FROM ghcr.io/amacneil/dbmate:2
COPY migrations /db/migrations
COPY migrate.sh /db/migrate.sh
ENTRYPOINT ["/bin/sh", "/db/migrate.sh"]
CMD ["up"]
