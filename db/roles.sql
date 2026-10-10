revoke all on database portfolio from public;
revoke all on schema public from public;

create role portfolio_migrator login password :'migrator_password';
create role portfolio_app login password :'app_password';

grant connect on database portfolio to portfolio_migrator, portfolio_app;
grant usage, create on schema public to portfolio_migrator;
grant usage on schema public to portfolio_app;
