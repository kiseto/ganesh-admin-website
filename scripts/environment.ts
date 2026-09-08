import nextEnv from "@next/env";
import mysql from "mysql2/promise";

nextEnv.loadEnvConfig(process.cwd());

export function scriptDatabase() {
  const { MYSQL_HOST: host, MYSQL_DATABASE: database, MYSQL_USER: user } = process.env;
  if (!host || !database || !user) throw new Error("Configure MYSQL_HOST, MYSQL_DATABASE and MYSQL_USER in .env.local first.");
  return mysql.createPool({ host, database, user, port: Number(process.env.MYSQL_PORT || 3306), password: process.env.MYSQL_PASSWORD || "", timezone: "Z", connectionLimit: 2, multipleStatements: false });
}
