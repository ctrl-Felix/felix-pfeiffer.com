FROM ghcr.io/amacneil/dbmate:2
COPY migrations /db/migrations
COPY migrate.sh /db/migrate.sh
USER 65534:65534
ENTRYPOINT ["/bin/sh", "/db/migrate.sh"]
CMD ["up"]
