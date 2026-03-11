import 'dotenv/config';

import { app } from "./api.js";
import { Redis } from '@upstash/redis'
import { cleanup } from "./cleaner.js";
import { BloomFilter } from './helper/bloom.js';
import { initBloomFilter } from './initBloom.js';

const port = process.env.PORT;  
const url = process.env.REDIS_REST_URL
const token = process.env.REDIS_REST_TOKEN
const bucketSize = process.env.BUCKET_SIZE || 100000
const shift = process.env.SHIFT || 9

export const bloomFilter = new BloomFilter(Number(bucketSize), Number(shift));

export const redis = new Redis({
  url,
  token,
})

initBloomFilter();

cleanup()

app.listen(port, () => {
    console.log("API LAYER IS UP & RUNNING.....")
})