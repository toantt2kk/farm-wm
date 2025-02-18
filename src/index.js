import { checkoutProcess } from "./automation/checkout.js";
import { processLogin } from "./automation/login-wm.js";
import { subcriptionsItem } from "./automation/subcription-item.js";
import { browserRunner } from "./browsers/browser.js";
import { createProfile } from "./browsers/profile.js";
import {
  DOMAIN_EMAIL,
  FILE_CI,
  FILE_ITEM,
  NAME_USER,
  SUCCESS_FILE,
  USER_STATE,
} from "./utils/contants.js";
import {
  appendToFile,
  getDataToFile,
  removeStringFromFile,
} from "./utils/file.js";
import { generateEmail } from "./utils/random-data.js";
const renameingCi = [];
const start = async () => {
  let GL;
  let page;
  let browser;
  try {
    const profileId = await createProfile({
      os: "win",
      proxy: {
        mode: "socks5",
        host: "127.0.0.1",
        port: 40000,
      },
    });
    const {
      GL: Gologin,
      browser: browserPptr,
      page: pagePptr,
    } = await browserRunner(profileId);
    GL = Gologin;
    browser = browserPptr;
    page = pagePptr;
    if (!browser || !page) {
      await browser.close();
      await GL.stop();
      await GL.delete(profileId);
      console.log("Failed to create browser.");
      return;
    }

    const info = generateEmail(NAME_USER, USER_STATE, DOMAIN_EMAIL);
    const isLogin = await processLogin(page, info);
    if (isLogin === "SERVER_ERROR") {
      console.log("Browser login failed. Skipping test.");
      await browser.close();
      await GL.stop();
      await GL.delete(profileId);
      return;
    }
    const itemList = await getDataToFile(FILE_ITEM);
    const { status, price } = await subcriptionsItem(page, itemList);
    if (!status) {
      await browser.close();
      await GL.stop();
      await GL.delete(profileId);
      return;
    }
    const {
      status: checkOutStatus,
      email,
      ci,
    } = await checkoutProcess(page, info);
    if (!checkOutStatus && !ci) {
      renameingCi.push(ci);
    } else if (checkOutStatus) {
      removeStringFromFile(FILE_CI, ci);
      appendToFile(SUCCESS_FILE, `${email}|${price}`);
    }

    // await browser.close();
    // await GL.stop();
    // await GL.delete(profileId);
    // save file success : email|moneyOrder
    console.log("All tests passed successfully.");
  } catch (error) {
    console.error("Task error");
    await browser.close();
    await GL.stop();
    await GL.delete(profileId);
  }
  return;
};
start();
