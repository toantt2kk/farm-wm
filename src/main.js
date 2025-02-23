import _ from "lodash";
import readline from "readline";
import { upsertCIs } from "./database/models/ci.js";
import { upsertItem } from "./database/models/item.js";
import { truncateTable, upsertTask } from "./database/models/task.js";
import { initializeTasks } from "./manager.js";
import { getScreenSize } from "./utils/command.js";
import { FILE_CI, FILE_ITEM } from "./utils/contants.js";
import { getDataToFile } from "./utils/file.js";
import { formatCard } from "./utils/formater.js";
import { logger } from "./utils/logger.js";
import { calculateRowsCols, setChromeWindows } from "./utils/resolution.js";
const CONCURRENCY = 10;
const SCALE = 0.25;
const PORTS = _.range(60000, 60101); // 60101 để bao gồm 60100

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
    await initializeTasks(tasks);
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
