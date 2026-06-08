use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

use crate::config::Config;
use crate::error::AppError;

pub async fn connect(config: &Config) -> Result<Option<PgPool>, AppError> {
    let Some(url) = config.database_url.as_deref() else {
        return Ok(None);
    };

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(url)
        .await?;

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| AppError::Internal(format!("migration: {e}")))?;

    Ok(Some(pool))
}
