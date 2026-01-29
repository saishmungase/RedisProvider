import Docker from "dockerode";
import crypto from "crypto";
import pool from "@redis/business/src/db/index.js"

const manager = new Docker();

const RANGE = { startPort: 7000, endPort: 7012 };

const getAvailablePort = async () => {
  const containers = await manager.listContainers({ all: true });
  const takenPorts = new Set<number>();

  containers.forEach(container => {
    container.Ports.forEach(port => {
      if (port.PublicPort) takenPorts.add(port.PublicPort);
    });
  });

  const dbResult = await pool.query('SELECT port FROM instances');
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
    await container.remove({ force: true });
    console.log(`Container ${containerId} deleted.`);
  } catch (e) {
    console.error("Deletion failed:", e);
  }
};

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

  const redisRootPassword = "Mungase@123";

  const container = await manager.createContainer({
    Image: "redis:7-alpine",
    Cmd: [
      "redis-server",
      "--requirepass", redisRootPassword,
      "--maxmemory", "12mb",
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
    Labels: { owner: ownerName, ownerId: ownerId }
  });

  await container.start();

  await new Promise(r => setTimeout(r, 3000));

  const aclCmd = [
    "redis-cli",
    "-a", redisRootPassword,
    "ACL", "SETUSER", clientUser,
    "ON",
    `>${password}`,
    "~*",
    "+@read", "+@write", "+@string", "+@hash", "+@list", "+@set", "+@sortedset", "+@bitmap",
    "-@admin", "-@dangerous", "-@connection"
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
      console.log(chunk.toString());
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

  return {
    userId,
    status : 200,
    containerId: container.id,
    assignedPort : port,
    username: clientUser,
    redisPassword: password
  };
};