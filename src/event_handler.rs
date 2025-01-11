use crate::{Error, Data};
use poise::serenity_prelude as serenity;
use sqlx::Row;
use serenity::model::id::ChannelId;

pub async fn event_handler(
    ctx: &serenity::Context,
    event: &serenity::FullEvent,
    data: &Data,
) -> Result<(), Error> {
    let name = event.snake_case_name();
    tracing::info!("Event triggered: {name:?}");
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
        _ => {}
    }
    Ok(())
}
