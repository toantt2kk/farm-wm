import { parentPort, workerData } from "worker_threads";
import AppDataSource from "./database/database.js";
import { start } from "./start.js";
import { logger } from "./utils/logger.js";

(async () => {
  try {
    await AppDataSource.initialize();
    const { task } = workerData;
    console.log("🚀 ~ task:", task);
    await start({
      port: task.port,
      x: task.position.x,
      y: task.position.y,
      screenW: task.resolution.width,
      screenH: task.resolution.height,
      workerId: task.task_id,
    });

    logger.info(`✅ Worker hoàn thành.`);
    parentPort.postMessage({ success: true, workerId });
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Worker bị lỗi: ${error.message}`);
    parentPort.postMessage({
      success: false,
      error: error.message,
      workerId,
    });
    process.exit(1);
  }
})();
