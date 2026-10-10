-- migrate:up
alter table events drop constraint events_visit_has_visitor;
alter table events add constraint events_visit_has_visitor check (kind <> 'visit' or visitor is not null);

create unique index events_one_click_per_visitor_target_and_day
  on events (visitor, target, day) where kind = 'click' and visitor is not null;

create table daily_salts (
  day date primary key,
  salt bytea not null
);

grant select, insert, delete on daily_salts to portfolio_app;

-- migrate:down
drop table daily_salts;
drop index events_one_click_per_visitor_target_and_day;
update events set visitor = null where kind = 'click';
alter table events drop constraint events_visit_has_visitor;
alter table events add constraint events_visit_has_visitor check ((kind = 'visit') = (visitor is not null));
