import pool from "../db/index.js";
import { mailTaken } from "../db/queries.js";
import { bloomFilter } from "../utils.js"

export const mailAvailable = async (email : string) => {
    email = email.trim().toLowerCase();

    const bloomCheck = bloomFilter.exists(email)
    if(!bloomCheck){
        return {
            isTaken : false
        };
    }
    
    const dbCheck = await pool.query(mailTaken, [email]);
    return {
        isTaken: dbCheck.rows[0].exists
    };
}