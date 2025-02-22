import { workerData } from "worker_threads";
import AppDataSource from "./database/database.js";
import { start } from "./start.js";
import { logger } from "./utils/logger.js";

(async () => {
  try {
    await AppDataSource.initialize();
    const { task } = workerData;
    if (!task) {
      return;
    }
    await start({
      port: task.port,
      x: task.position.x,
      y: task.position.y,
      screenW: task.resolution.width,
      screenH: task.resolution.height,
      task_id: task.task_id,
    });
    logger.info(`✅ Worker hoàn thành.`);
  } catch (error) {
    logger.error(`❌ Worker bị lỗi: ${error.message}`);
  }
})();
