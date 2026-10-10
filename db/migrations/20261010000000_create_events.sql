-- migrate:up
create table events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  day date not null default (now() at time zone 'utc')::date,
  kind text not null check (kind in ('visit', 'click')),
  target text,
  visitor text,
  constraint events_click_has_target check ((kind = 'click') = (target is not null)),
  constraint events_visit_has_visitor check ((kind = 'visit') = (visitor is not null))
);

create unique index events_one_visit_per_visitor_and_day on events (visitor, day) where kind = 'visit';
create index events_kind_day on events (kind, day);
create index events_click_target on events (target) where kind = 'click';

grant select, insert on events to portfolio_app;

-- migrate:down
drop table events;
