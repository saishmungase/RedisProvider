import Docker, { Container } from "dockerode";
import crypto from "crypto";

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

const container: Container = await manager.createContainer({
    Image: "redis:alpine",
    Cmd: [
      "redis-server",
      "--requirepass", crypto.randomBytes(32).toString("hex"),
      "--maxmemory", "12mb",
      "--maxmemory-policy", "allkeys-lru", 
      "--save", "",
      "--appendonly", "no"
    ],
    ExposedPorts: { "6379/tcp": {} },
    HostConfig: {
      PortBindings: { "6379/tcp": [{ HostPort: String(port) }] },
      Memory: 16 * 1024 * 1024,
      MemorySwap: 16 * 1024 * 1024,
      NanoCpus: 50_000_000,
      PidsLimit: 10
    },
    Labels: { owner: userName, ownerId: userId }
  });

  await container.start();

  const aclCmd = [
    "redis-cli", 
    "ACL", "SETUSER", clientUser, 
    "on", 
    `>${password}`, 
    "~*",
    "+@all",
    "-@admin",
    "-@dangerous",
    "+ping"
  ];

  const exec = await container.exec({
    Cmd: aclCmd,
    AttachStdout: true,
    AttachStderr: true
  });

  await exec.start({});

  return {
    userId,
    status : 200,
    containerId: container.id,
    port,
    username: clientUser,
    password: password
  };
};