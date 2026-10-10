-- migrate:up
alter table events add column source text;
alter table events add column landing text;
alter table events add constraint events_source_only_on_visits check ((source is null and landing is null) or kind = 'visit');

create index events_visit_source on events (day, source, landing) where kind = 'visit' and source is not null;

-- migrate:down
drop index events_visit_source;
alter table events drop constraint events_source_only_on_visits;
alter table events drop column landing;
alter table events drop column source;
