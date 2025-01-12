use crate::{Error, Data};
use poise::serenity_prelude as serenity;
use sqlx::Row;
use serenity::model::id::{ChannelId, UserId, GuildId};
use rand::{rngs::StdRng, Rng, SeedableRng};

pub async fn event_handler(
    ctx: &serenity::Context,
    event: &serenity::FullEvent,
    data: &Data,
) -> Result<(), Error> {
    let name = event.snake_case_name();
    tracing::info!("Event: {name:?}");

    match event {
        serenity::FullEvent::GuildMemberAddition { new_member } => {
            let user_id = new_member.user.id;
            let guild_id = new_member.guild_id;
            let pool = &data.pool;

            tracing::info!("New member joined: {user_id:?}");

            let row = sqlx::query("select welcome_channel_id from guilds where id = $1")
                .bind(i64::from(guild_id))
                .fetch_one(pool)
                .await?;
            let welcome_channel_id: Option<i64> = row.try_get("welcome_channel_id").ok();

            if let Some(channel_id) = welcome_channel_id {
                tracing::info!("Welcome channel found: {channel_id:?}");

                let row = sqlx::query("select welcome_role_id from guilds where id = $1")
                    .bind(i64::from(guild_id))
                    .fetch_one(pool)
                    .await?;
                let welcome_role_id: Option<i64> = row.try_get("welcome_role_id").ok();

                let mut message = format!("Приветик, <@{}>, приветствуем тебя в нашем кафе! <a:hellow:1327303097751572583>", user_id);

                if let Some(role_id) = welcome_role_id {
                    tracing::info!("Welcome role found: {role_id:?}");

                    message.push_str(format!("\n<@&{}>", role_id).as_str());
                }

                let channels = guild_id.channels(ctx).await?;
                let channel = channels.get(&ChannelId::new(channel_id.try_into().unwrap()));

                channel.expect("Channel not found").say(ctx, message).await?;
            }
        }
        serenity::FullEvent::Message { new_message } => {
            let user_id = new_message.author.id;
            let guild_id = new_message.guild_id;
            let mut cooldown_data = data.exp_cooldowns.lock().await;
            let cooldown = cooldown_data.get(&user_id);

            tracing::info!("User ID: {user_id:?}");
            tracing::info!("Guild ID: {guild_id:?}");
            tracing::info!("Cooldown: {:?}", cooldown);

            async fn add_exp(user_id: UserId, guild_id: GuildId, pool: &sqlx::PgPool, amount: i32) {
                let row = sqlx::query("select exp from members where id = $1")
                    .bind(i64::from(user_id))
                    .fetch_optional(pool)
                    .await;

                if let Ok(Some(row)) = row {
                    tracing::info!("Member found");

                    let old_exp: i32 = row.try_get("exp").unwrap();
                    let new_exp = old_exp + amount;

                    let _ = sqlx::query("update members set exp = $1 where id = $2")
                        .bind(new_exp)
                        .bind(i64::from(user_id))
                        .execute(pool)
                        .await;

                    tracing::info!("Exp added (old exp: {old_exp:?}, new exp: {new_exp:?})");
                } else {
                    tracing::info!("Member not found, creating..");

                    let _ = sqlx::query("insert into members (id, guild_id, exp, level, balance) values ($1, $2, $3, $4, $5)")
                        .bind(i64::from(user_id))
                        .bind(i64::from(guild_id))
                        .bind(amount)
                        .bind(0)
                        .bind(0)
                        .execute(pool)
                        .await;

                    tracing::info!("Member created, exp added (exp: {amount:?})");
                }
            }

            if let Some(guild_id) = guild_id {
                let configuration = sqlx::query("select exp_cooldown, exp_min, exp_max from guilds where id = $1")
                    .bind(i64::from(guild_id))
                    .fetch_one(&data.pool)
                    .await?;

                let exp_cooldown: Option<i32> = configuration.try_get("exp_cooldown")?;
                let exp_min: Option<i32> = configuration.try_get("exp_min")?;
                let exp_max: Option<i32> = configuration.try_get("exp_max")?;

                if let (Some(exp_cooldown), Some(exp_min), Some(exp_max)) = (exp_cooldown, exp_min, exp_max) {
                    let mut rng = StdRng::from_entropy();
                    let amount = rng.gen_range(exp_min..exp_max);

                    if let Some(cooldown) = cooldown {
                        if cooldown.elapsed() < std::time::Duration::from_secs(exp_cooldown.try_into().unwrap()) {
                            tracing::info!("Cooldown is still active");
                        } else {
                            tracing::info!("Cooldown expired");
                            cooldown_data.insert(user_id, std::time::Instant::now());
                            add_exp(user_id, guild_id, &data.pool, amount).await;
                        }
                    } else {
                        tracing::info!("Cooldown not found");
                        cooldown_data.insert(user_id, std::time::Instant::now());
                        add_exp(user_id, guild_id, &data.pool, amount).await;
                    }
                } else {
                    tracing::info!("One or more configuration values missing");
                }
            }
        }
        _ => {}
    }
    Ok(())
}
