import { listenForCaptcha } from "./automation/captcha.js";
import { checkoutProcess } from "./automation/checkout.js";
import { processLogin } from "./automation/login-wm.js";
import { subcriptionsItem } from "./automation/subcription-item.js";
import { browserRunner } from "./browsers/browser.js";
import { createProfile } from "./browsers/profile.js";
import { DOMAIN_EMAIL, NAME_USER, USER_STATE } from "./utils/contants.js";
import { logger } from "./utils/logger.js";
import { generateEmail } from "./utils/random-data.js";

export const start = async (options) => {
  const { port } = options;
  const profileId = await createProfile({
    os: "win",
    proxy: { mode: "socks5", host: "127.0.0.1", port },
  });
  const { GL, browser, page } = await browserRunner(profileId, options);
  await listenForCaptcha(page, browser, GL, profileId);
  if (!browser || !page) throw new Error("Không thể mở trình duyệt");
  try {
    const info = generateEmail(NAME_USER, USER_STATE, DOMAIN_EMAIL);
    const isLogin = await processLogin(page, info);
    if (isLogin === "SERVER_ERROR") throw new Error("Lỗi đăng nhập");
    const { status, price } = await subcriptionsItem(page);
    if (!status) throw new Error("Không thể đăng ký dịch vụ");
    await checkoutProcess(page, info, price);
    await browser.close();
    await GL.stop();
    await GL.delete(profileId);
    return;
  } catch (error) {
    logger.error(`❌ Lỗi chung: ${error.message}`);
    console.log("🚀 ~ start ~ GL:", GL);
    console.log("🚀 ~ start ~ browser:", browser);
    browser && (await browser.close());
    GL && (await GL.stop());
    GL && (await GL.delete(profileId));
    throw new Error("Thất bại");
  }
};
