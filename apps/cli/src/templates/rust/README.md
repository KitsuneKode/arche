# Rust API

Rust API service built with [Axum](https://github.com/tokio-rs/axum).

## Quick Start

```sh
cp .env.example .env
cargo run
```

Server starts at `http://localhost:3001` (override with `PORT` in `.env`).

## Build

```sh
cargo build --release
```

Binary at `target/release/rust-api`.
