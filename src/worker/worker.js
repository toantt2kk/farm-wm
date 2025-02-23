import { parentPort } from "worker_threads";
import AppDataSource from "../database/database.js";
import { readTask } from "../database/models/task.js";
import { logger } from "../utils/logger.js";
import { start } from "./start.js";

parentPort.on("message", async (message) => {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    const task = await readTask(message);
    if (!task) {
      return;
    }
    await start({
      port: task.port,
      x: task.position.x,
      y: task.position.y,
      screenW: task.resolution.width,
      screenH: task.resolution.height,
      task_id: task.id,
      scale: task.scale,
    });
    logger.info(`✅ Worker hoàn thành.`);
  } catch (error) {
    logger.error(`❌ Worker bị lỗi: ${error.message}`);
  }
});
