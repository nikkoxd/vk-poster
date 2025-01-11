use crate::{Context, Error};
use sqlx::Row;

/// Get bot's ping
#[poise::command(
    slash_command, 
    prefix_command,
)]
pub async fn ping(ctx: Context<'_>) -> Result<(), Error> {
    let ping = ctx.ping().await;
    ctx.say(format!("Pong! Response time: {ping:?}")).await?;
    Ok(())
}


/// Register/unregister application commands
#[poise::command(
    slash_command, 
    prefix_command
)]
pub async fn register(ctx: Context<'_>) -> Result<(), Error> {
    poise::builtins::register_application_commands_buttons(ctx).await?;
    Ok(())
}

/// Setup guild
#[poise::command(slash_command)]
pub async fn setup(ctx: Context<'_>) -> Result<(), Error> {
    let guild_id = ctx.guild_id().ok_or_else(|| anyhow::anyhow!("Not in a guild"))?;
    let pool = &ctx.data().pool;

    let guild_exists = sqlx::query("select 1 from guilds where id = $1")
        .bind(i64::from(guild_id))
        .fetch_optional(pool)
        .await?
        .is_some();

    if guild_exists {
        ctx.say("Guild has already been setup").await?;
    } else {
        sqlx::query("insert into guilds (id) values ($1)")
            .bind(i64::from(guild_id))
            .execute(pool)
            .await?;
        tracing::info!("Guild created in database: {guild_id:?}");
        ctx.say("Setup complete!").await?;
    }

    Ok(())
}

/// Test the welcome message
#[poise::command(slash_command)]
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
