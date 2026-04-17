# TODO

## Storage

- Add GCP driver
- Add Azure driver
- Add Cloudinary driver
- Add Wasabi driver

## Cascade

- Add Postgress Driver
- Add Mysql Driver

## Auth

- Google Login
- Github Login
- Facebook Login
- Apple Login

## Notifications

- Email Notifications
- SMS Notifications
- Push Notifications
- Whatsapp Notifications
- Discord Notifications
- Telegram Notifications
- Slack Notifications
- In-app Notifications

## Connectors

- Websockets Connector
- Prisma Connector
- TypeORM

## Repository

- Add Prisma Adapter
- Add TypeORM Adapter

## Commands

- `make` command: Generate boilerplate files for controllers, models, migrations, seeds, etc
  - Example: `warlock make controller --name=createNewUser --validation=true --module=users`
  - Example: `warlock make model --name=User --module=users`
  - Example: `warlock make migration --name="create users table" --model=User --module=users`
