import Docker, { Container } from "dockerode";
import crypto from "crypto";

const manager = new Docker();

const RANGE = { startPort: 7000, endPort: 7050 };

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
  throw new Error("No available ports in range");
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
  const password = crypto.randomBytes(16).toString("hex");

  const container : Container = await manager.createContainer({
    Image: "redis:alpine",
    Cmd: [
      "redis-server",
      "--requirepass", password,
      "--maxmemory", "100mb",
      "--maxmemory-policy", "allkeys-lru"
    ],
    ExposedPorts: { "6379/tcp": {} },
    HostConfig: {
      PortBindings: { "6379/tcp": [{ HostPort: String(port) }] },
      Memory: 128 * 1024 * 1024,
      NanoCpus: 500_000_000,
      PidsLimit: 100,
    },
    Labels: { owner: userName, ownerId: userId }
  });

  await container.start();

  return {
    userId,
    containerId: container.id,
    port,
    password
  };
};