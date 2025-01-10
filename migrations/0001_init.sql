do $$ begin
  create type language as enum (
    'en',
    'ru'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists guilds (
  id bigint primary key,
  language language not null default 'en',
  log_channel_id bigint,
  embed_color varchar(6) default '00ff00',
  member_role_id bigint,
  welcome_channel_id bigint,
  welcome_role_id bigint,
  econ_cooldown integer,
  econ_min integer,
  econ_max integer,
  econ_bump_reward integer,
  exp_cooldown integer,
  exp_min integer,
  exp_max integer
);

create table if not exists rewards (
  id bigint primary key,
  level integer not null
);

create table if not exists shop_items (
  id bigint primary key,
  price integer not null,
  expiry_time timestamp
);

create table if not exists members (
  id bigint primary key,
  guild_id bigint not null references guilds(id),
  exp integer not null default 0,
  level integer not null default 0,
  balance integer not null default 0,
  role_ids bigint[]
);

create or replace function check_role_ids()
returns trigger as $$
begin
  if new.role_ids is not null then
    if exists (
      select 1
      from unnest(new.role_ids) as id
      where not exists (
        select 1
        from shop_items
        where shop_items.id = id
      )
    ) then
      raise exception 'Invalid role id';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_role_ids_trigger
before insert on members
for each row
execute function check_role_ids();
