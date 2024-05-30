# Bitespeed Backend Task

## To run locally

```ts
bun install
bun run db:migrate --local --file="./drizzle/migrations/0000_gigantic_mattie_franklin.sql"
bun run dev
```

## curl for identify endpoint

```bash
curl --location 'https://bitespeed.sudarsh.me/identify' \
--header 'Content-Type: application/json' \
--data '{
    "email": "",
    "phoneNumber": ""
}'
```
