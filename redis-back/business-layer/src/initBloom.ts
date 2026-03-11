import pool from "./db/index.js";
import { allUser } from "./db/queries.js";
import { bloomFilter } from "./utils.js";

export const initBloomFilter = async () => {
    const users = await pool.query(allUser);

    users.rows.forEach((u) => {
      bloomFilter.add(u.email);
    }); 

    console.log("Bloom filter initialized");
}