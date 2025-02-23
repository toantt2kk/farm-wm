import { parentPort } from "worker_threads";
import { checkoutProcess } from "./automation/checkout.js";
import { processLogin } from "./automation/login-wm.js";
import { subcriptionsItem } from "./automation/subcription-item.js";
import { browserRunner } from "./browsers/browser.js";
import { createProfile } from "./browsers/profile.js";
import { updateTaskStatus } from "./database/models/task.js";
import { DOMAIN_EMAIL, NAME_USER, USER_STATE } from "./utils/contants.js";
import { logger } from "./utils/logger.js";
import { generateEmail } from "./utils/random-data.js";

export const start = async (options) => {
  const { port } = options;
  const profileId = await createProfile({
    os: "win",
    proxy: { mode: "socks5", host: "127.0.0.1", port },
    // proxy: { mode: "none" },
  });
  const { browser, page } = await browserRunner(profileId, options);
  if (!browser || !page) {
    await updateTaskStatus(options.task_id);
    parentPort.postMessage({ status: "restart", task_id: options.task_id });
    return "restart";
  }

  try {
    const info = generateEmail(NAME_USER, USER_STATE, DOMAIN_EMAIL);
    const isLogin = await processLogin(page, info);
    if (isLogin === "SERVER_ERROR") {
      await browser.close();
      return "server_error";
    }
    const { status, price } = await subcriptionsItem(page);
    if (!status) throw new Error("Không thể đăng ký dịch vụ");
    await checkoutProcess(page, info, price);
    await browser.close();
  } catch (error) {
    logger.error(`❌ Lỗi chung: ${error.message}`);
    browser && (await browser.close());
  }
  return "closed";
};
