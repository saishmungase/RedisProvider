// Cache-Asid:- Application manually fetches data from the database only when it's missing from the cache.
import pool from "../db/index.js";
import { fetchActives } from "../db/queries.js";
import { redis } from "../utils.js";

export class CacheManager {
    public id : string;
    private redis : any;

    constructor(){
        this.id = Date.now().toString()
        console.log("Manager Created (" + this.id + ")")
        this.redis = redis;
    }

    liveCache = async() =>{
        try {
            const instances : any | null = await this.redis.get("instances");
            if(!instances){
                const syncRes = await this.liveSync();
                return syncRes;
            }
            return instances;
        } catch (error) {
            console.error(error)
            return [];
        }
    } 

    liveSync = async () => {
        console.log("Sync Initiated At " + Date.now());
        try {
            const fetchLive = await pool.query(fetchActives);
            const active_instances = fetchLive.rows;
            try {
                await this.redis.set("instances", active_instances, {
                  ex : 3600
                });
                return fetchLive.rows;
            } catch (error) {
                console.log("Error While Storing In Redis")
                console.error(error)
            }
        } catch (error) {
            console.log("Error While Fetching In DB")
            console.error(error)  
        }
    }

    liveSet = async () => {
        try {
            // Slightly Expensive But Avoids Race Condition
            await this.liveSync();
        } catch (error) {
            console.log("Error While Updating Instances In Cache")
            console.error(error)
        }
    }

}