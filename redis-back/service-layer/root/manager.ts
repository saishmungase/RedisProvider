import Docker from "dockerode";
import crypto from "crypto";
import pool from "@redis/business/src/db/index.js"

const manager = new Docker();

const RANGE = { startPort: 7000, endPort: 7012 };

const admin_pass = process.env.ADMIN_PASS || "";

const USER_ALLOCATED_BYTES = 12 * 1024 * 1024;

const RELEVANT_KEYS = new Set([
  "used_memory",
  "used_memory_rss",
  "used_memory_peak",
  "used_memory_peak_perc",
  "total_system_memory",
  "maxmemory",
  "maxmemory_policy",
  "mem_fragmentation_ratio",
]);

const BYTE_KEYS = new Set([
  "used_memory",
  "used_memory_rss",
  "used_memory_peak",
  "total_system_memory",
  "maxmemory",
]);

function bytesToReadable(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) return (bytes / GB).toFixed(2) + " GB";
  if (bytes >= MB) return (bytes / MB).toFixed(2) + " MB";
  if (bytes >= KB) return (bytes / KB).toFixed(2) + " KB";
  return bytes + " B";
}

const getAvailablePort = async () => {
  const containers = await manager.listContainers({ all: true });
  const takenPorts = new Set<number>();

  containers.forEach(container => {
    container.Ports.forEach(port => {
      if (port.PublicPort) takenPorts.add(port.PublicPort);
    });
  });

  const dbResult = await pool.query("SELECT port FROM instances WHERE status = 'RUNNING'");
  dbResult.rows.forEach(row => {
    takenPorts.add(row.port);
  });

  for (let port = RANGE.startPort; port <= RANGE.endPort; port++) {
    if (!takenPorts.has(port)) return port;
  }
  
  return -1;
};

export const deleteContainer = async (containerId: string) => {
  try {
    const container = manager.getContainer(containerId);
    await container.stop().catch(() => {});
    await container.remove({ force: true, v: true });
    console.log(`Container ${containerId} deleted.`);
  } catch (e) {
    console.error("Deletion failed:", e);
  }
};

export const getAllContainers = async () => {
  try {
    const containers = await manager.listContainers({ all: true });
    return containers;
  } catch (error) {
    console.error("Error While Fetching Active Containers.")
  }
}

export const createInstance = async (props: { userId: string, userName: string }) => {
  const { userId, userName } = props;
  const port = await getAvailablePort();
  if(port == -1){
    return {
      userId,
      status : 429,
      containerId: null,
      port,
      username: null,
      password: null
    };
  }
  const clientUser = `user_${String(userId).slice(0, 8)}`; 
  const password = crypto.randomBytes(16).toString("hex");

  const ownerId = String(userId);
  const ownerName = String(userName);

  const redisRootPassword = admin_pass || "Mungase@123";

  const container = await manager.createContainer({
    Image: "redis:7-alpine",
    Cmd: [
      "redis-server",
      "--requirepass", redisRootPassword,
      "--maxmemory", "14mb",
      "--maxmemory-policy", "allkeys-lru", 
      "--save", "",
      "--appendonly", "no"
    ],
    ExposedPorts: { "6379/tcp": {} },
    HostConfig: {
      PortBindings: { "6379/tcp": [{ HostPort: String(port) }] },
      Memory: 32 * 1024 * 1024,
      MemorySwap: 32 * 1024 * 1024,
      NanoCpus: 100_000_000,
      PidsLimit: 20
    },
    Labels: { owner: ownerName, ownerId: ownerId, created_at: Date.now().toString() }
  });

  await container.start();

  await new Promise(r => setTimeout(r, 3000));

  const aclCmd = [
    "redis-cli",
    "-a", redisRootPassword,
    "--no-auth-warning",
    "ACL", "SETUSER", clientUser,
    "on",
    `>${password}`,
    "~*",
    "+@all",
    "-@admin",
    "-@dangerous",
    "-@scripting",
    "+FLUSHALL", 
    "+FLUSHDB",
    "+ping" 
  ];

  const exec = await container.exec({
    Cmd: aclCmd,
    AttachStdout: true,
    AttachStderr: true
  });

  const stream = await exec.start({});

  await new Promise((resolve, reject) => {
    let output = '';
    stream.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    stream.on("end", () => {
      if (output.includes("ERR")) {
        reject(new Error(`ACL setup failed: ${output}`));
      } else {
        resolve(output);
      }
    });
    stream.on("error", reject);
  });

  const memExec = await container.exec({
    Cmd: ["redis-cli", "-a", redisRootPassword, "INFO", "memory"],
    AttachStdout: true,
    AttachStderr: true
  });

  const memStream = await memExec.start({});
  const rawInfo = await new Promise<string>((resolve, reject) => {
    let data = "";
    memStream.on("data", (chunk) => data += chunk.toString());
    memStream.on("end", () => resolve(data));
    memStream.on("error", reject);
  });

  const match = rawInfo.match(/used_memory:(\d+)/);
  const overhead = match ? parseInt(match[1], 10) : 0;

  return {
    userId,
    status : 200,
    containerId: container.id,
    assignedPort : port,
    username: clientUser,
    redisPassword: password,
    overhead : overhead
  };
};

export async function parseRedisMemoryInfo(raw: string, containerId : string) {
  const result: Record<string, string | number> = {};
  let rawUsedMemory = 0;

  const data = await pool.query("SELECT overhead FROM Instances WHERE containerId = $1", [containerId])
  const REDIS_OVERHEAD_BYTES = data.rows[0].overhead || 1.14 * 1024 * 1024;

  const lines = raw
    .split("\n")
    .map((line) => line.replace(/[^\x20-\x7E\n\r]/g, "").trim())
    .filter((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex <= 0 || line.startsWith("#")) return false;
      const key = line.substring(0, colonIndex).trim();
      return RELEVANT_KEYS.has(key);
    });

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();

    if (key === "used_memory") {
      rawUsedMemory = Number(value);
      const userUsed = Math.max(0, rawUsedMemory - REDIS_OVERHEAD_BYTES);
      result[key] = bytesToReadable(userUsed);
    } else if (key === "maxmemory") {
      result[key] = bytesToReadable(USER_ALLOCATED_BYTES);
    } else if (BYTE_KEYS.has(key)) {
      result[key] = bytesToReadable(Number(value));
    } else if (key === "mem_fragmentation_ratio") {
      result[key] = Number(value);
    } else {
      result[key] = value;
    }
  }
  const userUsed = Math.max(0, rawUsedMemory - REDIS_OVERHEAD_BYTES);
  result.remain_memory = bytesToReadable(USER_ALLOCATED_BYTES - userUsed);

  return result;
}

export const redisCommand = async (containerId: string, admin_pass: string, command: string[]) => {
  const container = manager.getContainer(containerId);

  const exec = await container.exec({
    Cmd: [
      "redis-cli",
      "-a", admin_pass,
      ...command
    ],
    AttachStdout : true,
    AttachStderr : true
  })

  const stream = await exec.start({});

  return new Promise((resolve, reject)=>{
    let data ="";
    stream.on("data", (chunk : Buffer) => {
      data += chunk.toString();
    })
    stream.on("end", ()=>{
      resolve(parseRedisMemoryInfo(data, containerId));
    })
    stream.on("error", ()=>{
      const error = new Error("Error While Fetching From Streams.")
      reject(error)
    })
  })
}