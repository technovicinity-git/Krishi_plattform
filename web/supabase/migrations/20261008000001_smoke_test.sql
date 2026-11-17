-- Smoke test — creates a simple table to verify the migration pipeline works.
-- We will drop this table in a later migration.

create table if not exists _smoke_test (
  id         serial primary key,
  note       text not null,
  created_at timestamptz not null default now()
);

insert into _smoke_test (note) values ('Migration pipeline works.');