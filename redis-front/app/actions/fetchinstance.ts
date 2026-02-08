'use server'

export interface RedisMetrics {
    used_memory: string;
    used_memory_rss: string;
    used_memory_peak: string;
    used_memory_peak_perc: string;
    total_system_memory: string;
    maxmemory: string;
    maxmemory_policy: string;
    mem_fragmentation_ratio: number;
    remain_memory: string;
}

export interface InstanceResponse {
    username: string;
    password: string;
    status: string;
    createdat: string;
    data: RedisMetrics;
}

const fetchInstance = async (port: number, token: string) => {
    try {
        const response = await fetch(`http://localhost:3000/get-instance?port=${port}`, {
            method: 'GET',
            headers: { 
                "Content-Type": "application/json", 
                "authorization" : token 
            }
        });
        const status = response.status;
        const data = await response.json();
        data["status"] = status;
        return data

    } catch (error) {
        console.error("Server Action Error:", error);
        return null;
    }
}

export default fetchInstance;