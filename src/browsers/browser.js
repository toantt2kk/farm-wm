import GoLogin from "gologin/src/gologin.js";
import _ from "lodash";
import { homedir } from "os";
import { join } from "path";
import puppeteer from "puppeteer-core";
import { parentPort } from "worker_threads";
import { closeResources, listenForCaptcha } from "../automation/captcha.js";
import { _9ProxyForward } from "../proxy/9proxy.js";
import { PROFILE_ROOT, TOKEN_GOLOGIN } from "../utils/contants.js";
import { logger } from "../utils/logger.js";
const MAX_RETRIES = 5;
const MAX_RETRIES_CONNECT = 5;
const pathChrome = join(
  homedir(),
  ".gologin",
  "browser",
  "orbita-browser-132",
  "chrome.exe"
);

const browserRunner = async (profileId, options) => {
  const { screenH, screenW, x, y, port, task_id, scale } = options;
  let args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
    `--window-position=${x},${y}`,
    "--high-dpi-support=1",
    `--force-device-scale-factor=${scale}`,
  ];

  if (process.platform === "darwin") {
    _.remove(args, (v) => v.includes("--force-device-scale-factor"));
  }
  const GL = new GoLogin({
    token: TOKEN_GOLOGIN,
    profile_id: profileId,
    args,
    executablePath: pathChrome,
    tmpdir: PROFILE_ROOT,
  });

  let page = null;
  let browser = null;
  let retries = 0;
  let connected = false;
  let isConnectedProxy = false;
  while (retries < MAX_RETRIES && !connected) {
    retries++;
    try {
      // Khởi chạy GoLogin để lấy wsUrl
      const { wsUrl } = await GL.start();
      let connectRetries = 0;
      let puppeteerConnected = false;

      // Kết nối Puppeteer với retry logic
      while (connectRetries < MAX_RETRIES_CONNECT && !puppeteerConnected) {
        connectRetries++;
        try {
          browser = await puppeteer.connect({
            browserWSEndpoint: wsUrl,
            ignoreHTTPSErrors: true,
            defaultViewport: null,
          });
          puppeteerConnected = true;
          browser.on("disconnected", async () => {
            logger.warn(`[Thông báo] Trình duyệt ${task_id} đã ngắt kết nối`);
            await closeResources(browser, GL, profileId, port);
            parentPort.postMessage({
              status: "disconnected",
              task_id: task_id,
            });
          });
        } catch (error) {
          logger.error(
            `[Lỗi kết nối Puppeteer (thử ${connectRetries}/${MAX_RETRIES_CONNECT})] ${error}`
          );
        }
      }
      if (!puppeteerConnected) {
        logger.error("[Lỗi] Không kết nối được Puppeteer sau nhiều lần thử.");
        continue;
      }

      // Đóng page không cần thiết nếu có hơn 1
      const pages = await browser.pages();
      if (pages.length > 1) await pages[1].close();
      page = pages[0];
      await listenForCaptcha(page, browser, GL, profileId, port);
      connected = true;
    } catch (error) {
      logger.error(
        `[Lỗi trong quá trình khởi tạo trình duyệt (thử ${retries}/${MAX_RETRIES})] ${error}`
      );
      if (
        error.message.includes("Client network socket disconnected") ||
        error.message.includes("Proxy connection timed out") ||
        error.message.includes("socket hang up")
      ) {
        isConnectedProxy = true;
        break;
      }
    }
  }
  if (isConnectedProxy) {
    logger.error(
      `[Lỗi] Kết nối proxy thất bại hoặc đã hết hạn. task id ${task_id}`
    );
    await _9ProxyForward(port);
    if (GL) {
      await GL.stop();
      await GL.delete(profileId);
    }
    return { browser: null, page: null, GL: null };
  }
  if (!connected) {
    logger.error("[Lỗi] Không thể khởi tạo trình duyệt sau nhiều lần thử.");
  }

  return { browser, page, GL };
};

export { browserRunner };
