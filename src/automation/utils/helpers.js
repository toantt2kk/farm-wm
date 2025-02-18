import { TIMEOUT_REQUEST_PAGE } from "../../utils/contants.js";

const typeText = async (page, selector, text, timeout = 25, delay = 36) => {
  const element = await page.waitForSelector(selector, {
    visible: true,
    timeout: timeout * 1000,
  });
  if (!element) {
    throw new Error("Element not found");
  }
  await element.focus();
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Delete");
  await page.keyboard.type(text, { delay });
};
const enterKey = async (page, delay) => {
  await page.keyboard.press("Enter", { delay });
};
const clickElement = async (page, selector, timeout = 5, delay = 0.1) => {
  const element = await page.waitForSelector(selector, {
    visible: true,
    timeout: timeout * 1000,
  });
  if (!element) throw new Error(`Element not found: ${selector}`);
  await element.click({ delay: delay * 1000 });
};
const checkElementExits = async (page, selector, timeout = 5) => {
  try {
    const element = await page.waitForSelector(selector, {
      timeout: timeout * 1000,
    });
    return { element, isShow: true, selector };
  } catch (error) {
    return { element: null, isShow: false, selector: null };
  }
};
const checkXpathExits = async (page, xpath, timeout = 5) => {
  try {
    const element = await page.waitForSelector(`::-p-xpath(${xpath})`, {
      timeout: timeout * 1000,
    });
    return { element, isShow: true, selector: xpath };
  } catch (error) {
    return { element: null, isShow: false, selector: null };
  }
};
const clickByXPath = async (page, xpath, timeout = 0.1, delay = 10) => {
  try {
    const element = await page.waitForSelector(`::-p-xpath(${xpath})`, {
      timeout: delay * 1000,
    });
    if (!element) throw new Error(`Element not found: ${xpath}`);
    await element.click({ timeout: timeout * 1000 });
    return true;
  } catch (error) {
    console.error(`Error clicking element ${xpath}:`);
    return false;
  }
};
const waitForPageLoad = async (page) =>
  await page.waitForNavigation({
    waitUntil: ["domcontentloaded", "networkidle2"],
    timeout: TIMEOUT_REQUEST_PAGE,
  });
export {
  checkElementExits,
  checkXpathExits,
  clickByXPath,
  clickElement,
  enterKey,
  typeText,
  waitForPageLoad,
};
