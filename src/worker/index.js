import _ from "lodash";
import { upsertCIs } from "../database/models/ci.js";
import { upsertItem } from "../database/models/item.js";
import {
  readAllTask,
  truncateTable,
  upsertTask,
} from "../database/models/task.js";
import { getScreenSize } from "../utils/command.js";
import { FILE_CI, FILE_ITEM } from "../utils/contants.js";
import { getDataToFile } from "../utils/file.js";
import { formatCard } from "../utils/formater.js";
import { logger } from "../utils/logger.js";
import { calculateRowsCols, setChromeWindows } from "../utils/resolution.js";
import { WorkerManager } from "./manager-worker.js";

const CONCURRENCY = 5;
const SCALE = 0.3;
const PORTS = _.range(60000, 60101); // 60101 để bao gồm 60100
const PATH_WORKER = "./src/worker/worker.js";
export async function workers() {
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
    const { cols, rows } = calculateRowsCols(width, height, SCALE);
    const chromePositions = setChromeWindows(rows, cols, width, height, SCALE);
    const tasks = _.map(Array(CONCURRENCY), (_, index) => ({
      port: PORTS[index],
      task_id: index + 1,
      position: { x: chromePositions[index].x, y: chromePositions[index].y },
      resolution: {
        width: chromePositions[index].width,
        height: chromePositions[index].height,
      },
      scale: SCALE,
    }));

    const isUpTasks = await upsertTask(tasks);
    if (!isUpTasks) {
      logger.error("[Cảnh báo] Cập nhật dữ liệu tasks thất bại.");
      return;
    }

    logger.info("🚀 Bắt đầu chạy các worker tuần tự...");
    const workerManager = new WorkerManager({
      concurrency: CONCURRENCY,
      workerPath: PATH_WORKER,
    });
    const allTask = await readAllTask();
    await workerManager.createWorkers(allTask);
    logger.info("🎉 Hoàn thành tất cả các worker.");
  } catch (err) {
    logger.error("🚨 Lỗi trong main(): " + err.message);
  }
}
