const { Pool } = require("pg");

require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // SSL requerido por Aiven
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL conectado a Aiven");
});

pool.on("error", (error) => {
  console.error("❌ Error en PostgreSQL:", error.message);
});

module.exports = pool;