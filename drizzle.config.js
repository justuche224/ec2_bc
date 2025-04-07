"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var drizzle_kit_1 = require("drizzle-kit");
exports.default = (0, drizzle_kit_1.defineConfig)({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME || "test",
    port: Number(process.env.DB_PORT) || 3306,
  },
});
