-- migrate:up
alter table events drop constraint events_kind_check;
alter table events add constraint events_kind_check check (kind in ('visit', 'click', 'mcp'));

alter table events drop constraint events_click_has_target;
alter table events add constraint events_target_matches_kind check ((kind in ('click', 'mcp')) = (target is not null));

create index events_mcp_target on events (target) where kind = 'mcp';

-- migrate:down
drop index events_mcp_target;
delete from events where kind = 'mcp';

alter table events drop constraint events_target_matches_kind;
alter table events add constraint events_click_has_target check ((kind = 'click') = (target is not null));

alter table events drop constraint events_kind_check;
alter table events add constraint events_kind_check check (kind in ('visit', 'click'));
