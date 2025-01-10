use sqlx::Row;

use crate::{Context, Error};

#[poise::command(prefix_command)]
pub async fn welcome(ctx: Context<'_>) -> Result<(), Error> {
    let user_id = ctx.author().id;
    let guild_id = ctx.guild_id().ok_or_else(|| anyhow::anyhow!("Not in a guild"))?;
    let pool = &ctx.data().pool;

    let row = sqlx::query("select welcome_role_id from guilds where id = $1")
        .bind(i64::from(guild_id))
        .fetch_one(pool)
        .await?;
    let welcome_role_id: Option<i64> = row.try_get("welcome_role_id").ok();

    let mut message = format!("Приветик, <@{}>, приветствуем тебя в нашем кафе! <a:hellow:1327303097751572583>", user_id);

    if let Some(role_id) = welcome_role_id {
        message.push_str(format!("\n<@&{}>", role_id).as_str());
    }

    ctx.say(message).await?;

    Ok(())
}
