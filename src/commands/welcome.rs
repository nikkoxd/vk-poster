use crate::{Context, Error};

#[poise::command(prefix_command)]
pub async fn welcome(ctx: Context<'_>) -> Result<(), Error> {
    let user_id = ctx.author().id;
    ctx.say(format!("Приветик, <@{}>, приветствуем тебя в нашем кафе! <a:hellow:1327303097751572583>", user_id)).await?;
    Ok(())
}
