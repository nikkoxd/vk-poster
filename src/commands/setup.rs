use crate::{Context, Error};

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
        ctx.say("Guild already exists").await?;
    } else {
        sqlx::query("insert into guilds (id) values ($1)")
            .bind(i64::from(guild_id))
            .execute(pool)
            .await?;
        ctx.say("Guild created").await?;
    }

    Ok(())
}
