import { Worker } from "worker_threads";
import { counterCiUnused } from "./database/models/ci.js";
import { getTaskByPosition } from "./database/models/task.js";
import { logger } from "./utils/logger.js";

const workers = new Map();

async function startTask(task) {
  const counterCi = await counterCiUnused();
  if ((workers.has(task.task_id) && counterCi === 0) || !counterCi) {
    logger.warn(
      `[Cảnh báo] Worker có task id  ${task.task_id} đã bắt đầu hoặc đã tồn tại.`
    );
    return;
  }

  const worker = new Worker("./src/worker.js", {
    workerData: { task },
  });

  worker.on("message", async (message) => {
    if (message.status === "closed" || message.status === "disconnected") {
      logger.info(
        `[Thông báo] Worker có task id  ${message.task_id} đã đóng hoặc thoát.`
      );
      workers.delete(task.task_id);
      await restartTask(message.task_id);
    }
  });

  worker.on("error", async (error) => {
    logger.error(
      `[Cảnh báo] Worker có task id  ${task.task_id} bị lỗi: ${error.message}`
    );
    workers.delete(task.task_id);
    worker.terminate();
  });

  worker.on("exit", () => {
    logger.warn(`[Cảnh báo] Worker có task id  ${task.task_id} đã thoát!`);
    workers.delete(task.task_id);
    worker.terminate();
  });

  workers.set(task.task_id, worker);
}

async function restartTask(task_id) {
  const task = await getTaskByPosition(task_id);

  if (task) {
    await startTask(task);
  }
}

async function initializeTasks(tasks) {
  for (const task of tasks) {
    await startTask(task);
  }
}

export { initializeTasks, startTask };
