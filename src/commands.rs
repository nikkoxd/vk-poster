use crate::{Context, Error};
use poise::samples::HelpConfiguration;
use sqlx::Row;

/// Get bot's ping
#[poise::command(
    slash_command, 
    prefix_command,
    category = "Utility",
    name_localized("ru", "пинг"),
    description_localized("ru", "Получить пинг бота"),
)]
pub async fn ping(ctx: Context<'_>) -> Result<(), Error> {
    let ping = ctx.ping().await;
    ctx.say(format!("Pong! Response time: {ping:?}")).await?;
    Ok(())
}


/// Register/unregister application commands
#[poise::command(
    prefix_command,
    category = "Utility",
)]
pub async fn register(ctx: Context<'_>) -> Result<(), Error> {
    poise::builtins::register_application_commands_buttons(ctx).await?;
    Ok(())
}

/// Setup guild
#[poise::command(
    slash_command,
    prefix_command,
    category = "Utility",
    name_localized("ru", "настройка"),
    description_localized("ru", "Настройка гильдии")
)]
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
#[poise::command(
    slash_command,
    prefix_command,
    category = "Utility",
    name_localized("ru", "приветствие"),
    description_localized("ru", "Приветствие пользователя")
)]
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

/// Help message
#[poise::command(
    prefix_command, 
    category = "Utility",
    name_localized("ru", "помощь"),
    description_localized("ru", "Помощь по командам")
)]
pub async fn help(
    ctx: Context<'_>,
    #[description = "Command to get help for"]
    #[rest]
    mut command: Option<String>,
) -> Result<(), Error> {
    if ctx.invoked_command_name() != "help" {
        command = match command {
            Some(c) => Some(format!("{} {}", ctx.invoked_command_name(), c)),
            None => Some(ctx.invoked_command_name().to_string()),
        };
    }
    let extra_text_at_bottom = "Type `!help command` for more info on a command.\nYou can edit your `?help` message to the bot and the bot will edit its response.";

    let config = HelpConfiguration {
        show_subcommands: true,
        show_context_menu_commands: true,
        ephemeral: true,
        extra_text_at_bottom,

        ..Default::default()
    };
    poise::builtins::help(ctx, command.as_deref(), config).await?;
    Ok(())
}
