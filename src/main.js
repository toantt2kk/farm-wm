import _ from "lodash";
import readline from "readline";
import { Worker } from "worker_threads";
import { counterCiUnused, upsertCIs } from "./database/models/ci.js";
import { upsertItem } from "./database/models/item.js";
import {
  checkTaskAvaliable,
  readTask,
  truncateTable,
  updateTaskStatus,
  upsertTask,
} from "./database/models/task.js";
import { getScreenSize } from "./utils/command.js";
import { FILE_CI, FILE_ITEM } from "./utils/contants.js";
import { getDataToFile } from "./utils/file.js";
import { formatCard } from "./utils/formater.js";
import { sleeptime } from "./utils/helpers.js";
import { logger } from "./utils/logger.js";
import { calculateChromePositions } from "./utils/resolution.js";

const CONCURRENCY = 5;
const RESTART_DELAY_MS = 1000;

// Hàm chạy worker theo tuần tự
async function runWorkersSequentially(workerCount) {
  for (let workerId = 0; workerId < workerCount; workerId++) {
    createWorker(workerId + 1);
    await sleeptime(2, 5);
  }
}

async function createWorker(taskID) {
  console.log("🚀 ~ createWorker ~ taskID:", taskID);
  return new Promise((resolve) => {
    async function startWorker() {
      const countUnused = await counterCiUnused();
      if (countUnused === 0) {
        logger.error(
          `🚫 Worker ${taskID} đã vượt quá số lần restart (${countUnused}). Dừng lại.`
        );
        return resolve();
      }
      while (!(await checkTaskAvaliable(taskID))) {
        logger.info(`[Task ${taskID}] Chờ được giải phóng...`);
        await new Promise((res) => setTimeout(res, _.random(300, 1000)));
      }
      const task = await readTask(taskID);
      const worker = new Worker("./src/worker.js", {
        workerData: { task },
      });
      async function handleWorkerExit(reason, workerId) {
        logger.info(
          `🔄 Worker ${workerId} sẽ khởi động lại sau ${
            RESTART_DELAY_MS / 1000
          }s...`
        );
        await new Promise((res) => setTimeout(res, RESTART_DELAY_MS));
        await updateTaskStatus(workerId);
        await startWorker();
      }
      worker.on("message", async (message) => {
        if (message.success) {
          logger.info(`✅ Worker ${message.workerId} hoàn thành.`);
          await handleWorkerExit("completed", message.workerId);
        } else {
          logger.error(`❌ Worker ${message.workerId} lỗi: ${message.error}`);
          await handleWorkerExit("message error", message.workerId);
        }
      });

      worker.on("error", async (error) => {
        logger.error(`❌ Worker ${taskID} gặp lỗi: ${error.message}`);
        await handleWorkerExit("runtime error", taskID);
      });

      worker.on("exit", async (code) => {
        logger.error(`❌ Worker ${taskID} đã thoát với mã: ${code}`);
        await handleWorkerExit("process exit", taskID);
      });

      return worker;
    }

    startWorker();
  });
}

async function main() {
  try {
    await truncateTable("tasks");

    const allData = await getDataToFile(FILE_CI);
    const allItem = await getDataToFile(FILE_ITEM);
    const listItem = _.map(allItem, (item) => ({ item_id: item }));

    const isUpItem = await upsertItem(listItem);
    if (!isUpItem) {
      logger.error("[Cảnh báo] Cập nhật dữ liệu item thất bại.");
      return;
    }

    const ciList = _.map(allData, (c) => {
      const cc = formatCard(c, "|");
      return {
        cc_number: cc.numberCi,
        month: cc.month,
        year: cc.year,
        cvv: cc.cvv,
      };
    });

    const isSuccess = await upsertCIs(ciList);
    if (!isSuccess) {
      logger.error("[Cảnh báo] Cập nhật dữ liệu CI thất bại.");
      return;
    }

    const { height, width } = getScreenSize();
    const positions = calculateChromePositions(width, height, CONCURRENCY);
    const tasks = _.map(Array(CONCURRENCY), (_, index) => ({
      port: 0,
      task_id: index + 1,
      position: { x: positions[index].x, y: positions[index].y },
      resolution: {
        width: positions[index].width,
        height: positions[index].height,
      },
    }));

    const isUpTasks = await upsertTask(tasks);
    if (!isUpTasks) {
      logger.error("[Cảnh báo] Cập nhật dữ liệu tasks thất bại.");
      return;
    }

    logger.info("🚀 Bắt đầu chạy các worker tuần tự...");
    await runWorkersSequentially(CONCURRENCY);

    logger.info("🎉 Hoàn thành tất cả các worker.");
  } catch (err) {
    logger.error("🚨 Lỗi trong main(): " + err.message);
  }
}

// Điều khiển chương trình với phím F5 hoặc Enter
if (process.stdin.isTTY && typeof process.stdin.setRawMode === "function") {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on("keypress", (str, key) => {
    if (key.name === "f5") {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      main();
    }
  });
} else {
  console.warn("STDIN không phải TTY. Nhấn Enter để chạy main().");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.on("line", () => {
    rl.close();
    main();
  });
}
