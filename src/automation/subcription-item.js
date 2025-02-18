import { calculateAdditions } from "../utils/calculate.js";
import {
  MAX_COUNT_ORDER,
  MAX_ITEM_ORDER,
  TIMEOUT_REQUEST_PAGE,
} from "../utils/contants.js";
import { delay, pickAndRemove } from "../utils/helpers.js";
import {
  checkElementExits,
  checkXpathExits,
  clickByXPath,
  clickElement,
  waitForPageLoad,
} from "./utils/helpers.js";

const DOM_SUBSCRIPTION = {
  DISABLE: '//div[contains(text(), "Not Available")]',
  NOT_AVAIL: 'input[name="subscription options"][disabled]',
  SUB_BUTTON:
    '//div[@id="ip-subscription-options-subscribe-wplus"]//span[contains(text(), "$")]',
  SET_WEEK: "#subscription-icon-0",
  CHECK_ORDER_PLACE: 'div[data-testid="quantity-stepper"]',
  OUT_OF_STOCK: '//h3[contains(text(), "This item is out of stock")]',
  BUTTON_SUB_CART:
    'div[data-testid="add-to-cart-section"] div[data-testid="subscribe-button"] button',
  BUTTON_REMOVE: "//button[contains(text(), 'Remove')]",
  QUANTITY_INCREASE: "//button[contains(@aria-label, 'Increase quantity')]",
  BUTTON_CHECKOUT: 'button[data-automation-id="checkout"]',
  TEXT_PRICE: 'div[data-sensitivity="severe"]',
  SET_UP_DIALOG: 'button[data-testid="setup-subscription-view-button"]',
};

const subcriptionsItem = async (page, itemList) => {
  let orderSuccess = false;
  let price = 0;

  while (!orderSuccess && itemList.length > 0) {
    const itemId = pickAndRemove(itemList);
    if (!itemId) break;

    console.log(`Đang xử lý mặt hàng: ${itemId}`);
    try {
      if (!(await loadPage(page, itemId))) continue;
      if (await checkSubscriptionDisabled(page)) continue;
      if (!(await initiateSubscription(page))) continue;
      if (await checkOnlyItem(page)) {
        await removeItemFromCart(page);
        continue;
      }

      await page.goto("https://www.walmart.com/cart", {
        timeout: TIMEOUT_REQUEST_PAGE,
        waitUntil: ["domcontentloaded", "load", "networkidle2"],
      });

      const priceItem = await getPrice(page);
      if (priceItem >= 250) {
        console.log(`Giá mặt hàng ${itemId} quá cao. Bỏ qua.`);
        await removeItemFromCart(page);
        continue;
      }

      console.log(
        `Giá của mặt hàng ${itemId}: ${priceItem}. Điều chỉnh số lượng...`
      );
      const totalCount = calculateAdditions(priceItem, MAX_COUNT_ORDER);
      price = priceItem * totalCount;
      await adjustItemQuantity(page, totalCount);

      await Promise.all([
        clickElement(page, DOM_SUBSCRIPTION.BUTTON_CHECKOUT, 15, 0.8),
        waitForPageLoad(page),
      ]);
      orderSuccess = true;
    } catch (error) {
      console.log(`Lỗi khi xử lý mặt hàng ${itemId}: ${error.message}`);
    }
  }
  return { status: orderSuccess, price };
};

const loadPage = async (page, itemId) => {
  try {
    await page.goto(`https://www.walmart.com/ip/${itemId}`, {
      timeout: TIMEOUT_REQUEST_PAGE,
      waitUntil: ["domcontentloaded", "load", "networkidle2"],
    });
    return true;
  } catch {
    return false;
  }
};

const checkSubscriptionDisabled = async (page) => {
  const check = await Promise.race([
    checkXpathExits(page, DOM_SUBSCRIPTION.NOT_AVAIL, 10),
    checkElementExits(page, DOM_SUBSCRIPTION.DISABLE, 10),
    checkXpathExits(page, DOM_SUBSCRIPTION.SUB_BUTTON, 10),
  ]);
  return check.selector !== DOM_SUBSCRIPTION.SUB_BUTTON;
};

const initiateSubscription = async (page) => {
  await clickByXPath(page, DOM_SUBSCRIPTION.SUB_BUTTON);
  await delay(2);
  await clickElement(page, DOM_SUBSCRIPTION.SET_WEEK);
  await delay(2);
  await clickElement(page, DOM_SUBSCRIPTION.BUTTON_SUB_CART);

  const check = await Promise.race([
    checkElementExits(page, DOM_SUBSCRIPTION.SET_UP_DIALOG, 10),
    checkXpathExits(page, DOM_SUBSCRIPTION.OUT_OF_STOCK, 10),
    checkElementExits(page, DOM_SUBSCRIPTION.CHECK_ORDER_PLACE, 10),
  ]);
  return check.selector === DOM_SUBSCRIPTION.CHECK_ORDER_PLACE;
};

const removeItemFromCart = async (page) => {
  await clickByXPath(page, DOM_SUBSCRIPTION.BUTTON_REMOVE, 10);
  await delay(2);
};

const adjustItemQuantity = async (page, totalCount) => {
  for (let i = 1; i < Math.min(totalCount, MAX_ITEM_ORDER); i++) {
    await clickByXPath(page, DOM_SUBSCRIPTION.QUANTITY_INCREASE, 10);
  }
};

const checkOnlyItem = async (page) => {
  return (
    await checkXpathExits(
      page,
      "//span[contains(text(), 'Only ') and contains(text(), ' left')]"
    )
  ).isShow;
};

const getPrice = async (page) => {
  let checkPrice = await page
    .waitForSelector(DOM_SUBSCRIPTION.TEXT_PRICE, { timeout: 5000 })
    .catch(() => false);
  if (!checkPrice) {
    await page.reload({
      timeout: TIMEOUT_REQUEST_PAGE,
      waitUntil: ["domcontentloaded", "load", "networkidle2"],
    });
  }
  return await page.evaluate(() => {
    const element = document.querySelector('div[data-sensitivity="severe"]');
    return element ? Number(element.innerText.replace("$", "").trim()) : null;
  });
};

export { subcriptionsItem };
