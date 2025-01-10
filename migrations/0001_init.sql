create type language if not exists as enum (
  'en',
  'ru'
);

create table if not exists guilds (
  id varchar(18) primary key,
  language language not null,
  log_channel_id varchar(18),
  embed_color varchar(6) default '00ff00',
  member_role_id varchar(18),
  welcome_channel_id varchar(18),
  welcome_role_id varchar(18),
  econ_cooldown integer,
  econ_min integer,
  econ_max integer,
  econ_bump_reward integer,
  exp_cooldown integer,
  exp_min integer,
  exp_max integer
);

create table if not exists rewards (
  id varchar(18) primary key,
  level integer not null
);

create table if not exists shop_items (
  id varchar(18) primary key,
  price integer not null,
  expiry_time timestamp
);

create table if not exists members (
  id varchar(18) primary key,
  guild_id varchar(18) not null references guilds(id),
  exp integer not null default 0,
  level integer not null default 0,
  balance integer not null default 0,
  role_ids varchar(18)[]
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
