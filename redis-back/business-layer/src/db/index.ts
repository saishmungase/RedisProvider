import pkg from "pg";
const { Pool } = pkg;

const url = process.env.DATABASE_URL

const pool = new Pool({
  connectionString: url,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;