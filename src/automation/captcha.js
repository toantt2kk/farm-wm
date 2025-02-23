import { updateTaskStatus } from "../database/models/task.js";
import { _9ProxyForward } from "../proxy/9proxy.js";
import { PROFILE_ROOT } from "../utils/contants.js";
import { deleteProfile } from "../utils/file.js";
import { logger } from "../utils/logger.js";
import { clickElement } from "./utils/helpers.js";

const handleHumanChallenge = async (page, mouse) => {
  let retryCount = 0;
  const maxRetries = 5;
  let isMouseDown = false;
  while (retryCount++ < maxRetries) {
    try {
      const pressHoldChallenge = await page
        .waitForSelector(
          '::p-xpath(//h2[contains(text(), "Robot or human?")])',
          {
            timeout: 15000,
          }
        )
        .catch(() => null);
      if (pressHoldChallenge) {
        const click = await page.$(
          '::-p-xpath(//*[contains(text(), "Press & Hold")])'
        );
        if (click) {
          const box = await click.boundingBox();
          if (box) {
            await mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await mouse.down();
            await delay(5);
            isMouseDown = true;
            console.log(
              "🚀 ~ handleHumanChallenge ~ isMouseDown:",
              isMouseDown
            );
            logger.info("[INFO] Đã nhấn giữ nút 'Press & Hold'.");
          }
        }
      }
      const isCaptcha = await page
        .waitForSelector(
          '::p-xpath(//h2[contains(text(), "Robot or human?")])',
          { timeout: 12000, visible: true }
        )
        .catch(() => null);
      if (isCaptcha) {
        logger.error("[LỖI] CAPTCHA xuất hiện! Chờ và thử lại...");
        if (isMouseDown) {
          console.log("🚀 ~ handleHumanChallenge ~ isMouseDown:", isMouseDown);
          await mouse.up();
          isMouseDown = false;
        }
        continue;
      }
      const errorElement = await page
        .waitForSelector(
          '::-p-xpath(//div[contains(text(), "Something went wrong, please try again")])',
          { timeout: 5000 }
        )
        .catch(() => null);
      if (errorElement) {
        logger.warn(
          "[CẢNH BÁO] Phát hiện lỗi 'Something went wrong', nhấn 'Continue'."
        );
        if (isMouseDown) {
          await mouse.up();
          isMouseDown = false;
        }
        await clickElement(page, 'div[aria-label="Continue"]');
        continue;
      }
      if (isMouseDown) {
        await mouse.up();
        isMouseDown = false;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error(`[LỖI] Xảy ra lỗi khi xử lý thử thách: ${error.message}`);
      if (isMouseDown) {
        await mouse.up();
        isMouseDown = false;
      }
    }
  }
};
export const listenForCaptcha = async (page, browser, GL, profileId, port) => {
  page.on("request", async (request) => {
    const url = request.url();
    if (url.includes("captcha/captcha.js?")) {
      logger.warn("[⚠️ CẢNH BÁO] Phát hiện CAPTCHA! Dừng ngay tiến trình.");
      // await closeResources(browser, GL, profileId, port);
      await browser.close();
      await _9ProxyForward(port);
      // process.exit(1);
    }
  });
};

// Hàm dọn dẹp tài nguyên trước khi thoát
export const closeResources = async (browser, GL, profileId) => {
  try {
    if (browser) await browser.close();
    if (GL) {
      await GL.stop();
      if (profileId) await GL.delete(profileId);
      deleteProfile(PROFILE_ROOT, profileId);
    }
    await updateTaskStatus(task.task_id);
  } catch (err) {
    logger.error("[⚠️] Lỗi khi dọn dẹp tài nguyên: ", err);
  }
};
