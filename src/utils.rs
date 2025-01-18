use poise::serenity_prelude as serenity;
use serenity::model::id::{UserId, GuildId};
use sqlx::Row;

pub async fn add_balance(user_id: UserId, guild_id: GuildId, pool: &sqlx::PgPool, amount: i32) {
    let row = sqlx::query("select balance from members where id = $1")
        .bind(i64::from(user_id))
        .fetch_optional(pool)
        .await;

    if let Ok(Some(row)) = row {
        tracing::info!("Member found");

        let old_balance: i32 = row.try_get("balance").unwrap();
        let new_balance = old_balance + amount;

        sqlx::query("update members set balance = $1 where id = $2")
            .bind(new_balance)
            .bind(i64::from(user_id))
            .execute(pool)
            .await
            .expect("Failed to update balance");

        tracing::info!("Balance added (old balance: {old_balance:?}, new balance: {new_balance:?})");
    } else {
        tracing::info!("Member not found, creating..");

        sqlx::query("insert into members (id, guild_id, exp, level, balance) values ($1, $2, $3, $4, $5)")
            .bind(i64::from(user_id))
            .bind(i64::from(guild_id))
            .bind(0)
            .bind(0)
            .bind(amount)
            .execute(pool)
            .await
            .expect("Failed to add member");

        tracing::info!("Member created, balance added (balance: {amount:?})");
    }
}

pub fn get_required_exp(level: i32) -> i32 {
    return 100 * level + level.pow(2) * 50; 
}

pub async fn add_exp(user_id: UserId, guild_id: GuildId, pool: &sqlx::PgPool, amount: i32) {
    let row = sqlx::query("select exp, level from members where id = $1")
        .bind(i64::from(user_id))
        .fetch_optional(pool)
        .await;

    if let Ok(Some(row)) = row {
        tracing::info!("Member found");

        let old_exp: i32 = row.try_get("exp").unwrap();
        let new_exp = old_exp + amount;

        let mut level: i32 = row.try_get("level").unwrap();
        if new_exp >= get_required_exp(level + 1) {
            level += 1;
        }

        sqlx::query("update members set exp = $1, level = $2 where id = $3")
            .bind(new_exp)
            .bind(level)
            .bind(i64::from(user_id))
            .execute(pool)
            .await
            .expect("Failed to update exp");

        tracing::info!("Exp added (old exp: {old_exp:?}, new exp: {new_exp:?})");
    } else {
        tracing::info!("Member not found, creating..");

        sqlx::query("insert into members (id, guild_id, exp, level, balance) values ($1, $2, $3, $4, $5)")
            .bind(i64::from(user_id))
            .bind(i64::from(guild_id))
            .bind(amount)
            .bind(0)
            .bind(0)
            .execute(pool)
            .await
            .expect("Failed to add member");

        tracing::info!("Member created, exp added (exp: {amount:?})");
    }
}
