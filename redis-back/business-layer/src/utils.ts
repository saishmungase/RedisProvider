import { app } from "./api.js";
import { Redis } from '@upstash/redis'

const port = process.env.PORT;  
const url = process.env.REDIS_REST_URL
const token = process.env.REDIS_REST_TOKEN

export const redis = new Redis({
  url,
  token,
})

app.listen(port, () => {
    console.log("API LAYER IS UP & RUNNING.....")
})