import { mkdirSync } from "node:fs";
import { writeFileSync, existsSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

const port = 5435;
const superPassword = process.env.POSTGRES_SUPER_PASSWORD ?? "creator-local-super";
const migratorPassword = process.env.CREATOR_MIGRATOR_PASSWORD ?? "creator-local-migrator";
const appPassword = process.env.CREATOR_APP_PASSWORD ?? "creator-local-app";
const mediaSecret = process.env.MEDIA_SECRET ?? "creator-local-media";
const dataDir = "data/postgres";

function quote(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

mkdirSync("data", { recursive: true });

const embedded = new EmbeddedPostgres({
  databaseDir: dataDir,
  port,
  user: "postgres",
  password: superPassword,
  persistent: true,
  onLog: () => {},
  onError: (message) => {
    const text = String(message);
    if (!text.includes("database system is ready")) console.error(text);
  },
});

if (!existsSync(`${dataDir}/PG_VERSION`)) {
  await embedded.initialise();
}
await embedded.start();

const admin = new pg.Client({
  host: "127.0.0.1",
  port,
  user: "postgres",
  password: superPassword,
  database: "postgres",
});
await admin.connect();

await admin.query(`
  DO $$ BEGIN
    CREATE ROLE creator_migrator LOGIN PASSWORD ${quote(migratorPassword)} CREATEDB;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
`);
await admin.query(`
  DO $$ BEGIN
    CREATE ROLE creator_app LOGIN PASSWORD ${quote(appPassword)} NOSUPERUSER NOCREATEDB NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
`);
await admin.query(`ALTER ROLE creator_migrator PASSWORD ${quote(migratorPassword)}`);
await admin.query(`ALTER ROLE creator_app PASSWORD ${quote(appPassword)}`);

const databases = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'creator'");
if (databases.rowCount === 0) {
  await admin.query("CREATE DATABASE creator OWNER creator_migrator");
}
await admin.query("GRANT CONNECT ON DATABASE creator TO creator_app");
await admin.end();

const env = `POSTGRES_SUPER_PASSWORD=${superPassword}
CREATOR_MIGRATOR_PASSWORD=${migratorPassword}
CREATOR_APP_PASSWORD=${appPassword}
MIGRATE_URL=postgresql://creator_migrator:${encodeURIComponent(migratorPassword)}@127.0.0.1:5435/creator
DATABASE_URL=postgresql://creator_app:${encodeURIComponent(appPassword)}@127.0.0.1:5435/creator
SEED_ADMIN_PASSWORD=${process.env.SEED_ADMIN_PASSWORD ?? "admin-local-creator"}
SEED_DEMO_PASSWORD=${process.env.SEED_DEMO_PASSWORD ?? "demo-local-creator"}
MEDIA_SECRET=${mediaSecret}
`;

if (!existsSync(".env")) {
  writeFileSync(".env", env);
  console.log("Arquivo .env criado para o banco local.");
}

console.log("Postgres escutando em 127.0.0.1:5435");
await new Promise(() => {});
