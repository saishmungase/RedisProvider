import { deleteContainer, getAllContainers } from "@redis/service/root/manager.js";
import cron from "node-cron";
import pool from "./db/index.js";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const autoSync = async (containers) => {

  const result = await pool.query(
    "SELECT containerId FROM instances WHERE status = 'RUNNING'"
  );

  const dbRows = result.rows;

  const dockerSet = new Set();
  const dbSet = new Set();

  for (const c of containers) {
    dockerSet.add(c.Id);
  }

  for (const row of dbRows) {
    dbSet.add(row.containerid);
  }

  for (const c of containers) {
    if (!dbSet.has(c.Id)) {
      await deleteContainer(c.Id);
    }
  }

  const toDelete = [];

  for (const id of dbSet) {
    if (!dockerSet.has(id)) {
      toDelete.push(id);
    }
  }

  if (toDelete.length > 0) {
    await pool.query(
      "UPDATE instances SET status = 'STOPPED' WHERE containerId = ANY($1)",
      [toDelete]
    );
  }
};


export const cleanup = async () => cron.schedule('*/30 * * * *', async () => {
  console.log("🔄 Running cleanup job for expired containers...");
  try {

    const containers = await getAllContainers();

    if(!containers) return;
    
    await autoSync(containers)

    for (const containerInfo of containers) {
      const createdAtStr = containerInfo.Labels['created_at'];
      
      if (createdAtStr) {
        const createdAt = parseInt(createdAtStr, 10);
        const age = Date.now() - createdAt;
        if (age > MAX_AGE_MS) {
          console.log(`🗑️ Container ${containerInfo.Id.slice(0, 8)} is expired (${(age/3600000).toFixed(1)}h old). Deleting...`);
          await deleteContainer(containerInfo.Id);
          console.log("Container Deletion with containerId:- ", containerInfo.Id)
          await pool.query(
            "UPDATE instances SET status = 'STOPPED' WHERE containerId = $1 AND status != 'STOPPED'",
            [containerInfo.Id]
          );

          console.log("Update In Database for containerId:- ", containerInfo.Id)
        }
      }
    }

  } catch (error) {
    console.error("❌ Cleanup job failed:", error);
  }
});