import { Worker } from "worker_threads";
import { counterCiUnused } from "../database/models/ci.js";
import { itemInStockCount } from "../database/models/item.js";
import { delay } from "../utils/helpers.js";
import { logger } from "../utils/logger.js";

export class WorkerManager {
  constructor(options) {
    this.options = options;
    this.workers = new Map();
  }

  async createWorker(workerPath, taskId) {
    if (this.workers.has(taskId)) {
      logger.warn(`[WARN] Worker for taskId ${taskId} already exists.`);
      return this.workers.get(taskId);
    }

    const worker = new Worker(workerPath);
    this.workers.set(taskId, worker);
    worker.postMessage(taskId);
    this.workerOnMessage(taskId, async (msg) => {
      if (msg.status === "disconnected") {
        logger.info(`[INFO] Worker ${msg.task_id} disconnected.`);
        await this.restartTask(msg.task_id);
      }
    });
    worker.on("error", (err) => {
      logger.error(`[ERROR] Worker ${taskId} encountered an error:`, err);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        logger.warn(`[WARN] Worker ${taskId} stopped with exit code ${code}`);
      }
      this.workers.delete(taskId);
    });

    return worker;
  }

  async killAllWorkers() {
    for (const [taskId, worker] of this.workers.entries()) {
      worker.terminate();
      logger.info(`[INFO] Worker ${taskId} terminated.`);
    }
    this.workers.clear();
  }

  async restartTask(taskId) {
    const worker = this.workers.get(taskId);
    const countCi = await counterCiUnused();
    const countItem = await itemInStockCount();
    if (!worker) {
      logger.error(`[ERROR] Worker with taskId ${taskId} not found`);
      return;
    }
    if (countCi === 0 && countItem === 0) {
      return;
    }
    worker.postMessage(taskId);
    logger.info(`[INFO] Worker ${taskId} sent restart message.`);
  }

  async releaseWorker(taskId) {
    const worker = this.workers.get(taskId);
    if (!worker) {
      logger.error(`[ERROR] Worker with taskId ${taskId} not found`);
      return;
    }
    worker.terminate();
    this.workers.delete(taskId);
    logger.info(`[INFO] Worker ${taskId} released.`);
  }

  async createWorkers(tasks) {
    if (!tasks || tasks.length === 0) {
      logger.debug("[DEBUG] Không có công việc để thực thi");
      return;
    }

    const taskCount = Math.min(this.options.concurrency, tasks.length);
    for (let i = 0; i < taskCount; i++) {
      await this.createWorker(this.options.workerPath, tasks[i].id);
      await delay(3);
    }
  }

  async workerOnMessage(taskId, callback) {
    const worker = this.workers.get(taskId);
    if (!worker) {
      logger.error(`[ERROR] Worker with taskId ${taskId} not found`);
      return;
    }
    worker.on("message", callback);
  }
}
