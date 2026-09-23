import "dotenv/config";
import { readFileSync } from "node:fs";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.MIGRATE_URL });
await client.connect();
await client.query(readFileSync("prisma/grant.sql", "utf8"));
await client.end();
console.log("Permissões do papel creator_app aplicadas.");
