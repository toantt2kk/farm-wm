import {
  itemInStockCount,
  randomItem,
  updateItem,
} from "../database/models/item.js";
import { calculateAdditions } from "../utils/calculate.js";
import {
  MAX_COUNT_ORDER,
  MAX_ITEM_ORDER,
  TIMEOUT_REQUEST_PAGE,
} from "../utils/contants.js";
import { delay } from "../utils/helpers.js";
import { logger } from "../utils/logger.js";
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
  WARNING_ITEM:
    '//span[contains(text(), "item in your cart is currently unavailable. ")]',
  CLICK_SUB: 'input[name="subscription options"]',
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
  TEXT_PRICE_BLACK:
    '//div[@data-testid="line-price"][contains(@class, "black")]',
  TEXT_PRICE_GREEN:
    '//div[@data-testid="line-price"][contains(@class, "green")]',
  SET_UP_DIALOG: 'button[data-testid="setup-subscription-view-button"]',
};

const subcriptionsItem = async (page) => {
  let orderSuccess = false;
  let price = 0;
  const itemIntockCount = await itemInStockCount();
  while (!orderSuccess && itemIntockCount) {
    const itemId = await randomItem();
    price = 0;
    if (!itemId) break;
    logger.info(`Đang xử lý mặt hàng: ${itemId}`);
    try {
      if (!(await loadPage(page, itemId))) {
        logger.warn(`[${itemId}] Không tải được trang. Bỏ qua.`);
        continue;
      }
      if (await checkSubscriptionDisabled(page)) {
        logger.warn(`[${itemId}] Tùy chọn đăng ký bị vô hiệu hóa. Bỏ qua.`);
        await updateItem(itemId);
        continue;
      }
      if (!(await initiateSubscription(page))) {
        logger.warn(`[${itemId}] Khởi tạo đăng ký không thành công. Bỏ qua.`);
        continue;
      }
      if (await checkOnlyItem(page)) {
        logger.warn(`[${itemId}] Chỉ còn 1 sản phẩm. Loại bỏ khỏi giỏ.`);
        await removeItemFromCart(page);
        await updateItem(itemId);
        continue;
      }

      logger.info(`[${itemId}] Chuyển đến trang giỏ hàng.`);
      await page.goto("https://www.walmart.com/cart", {
        timeout: TIMEOUT_REQUEST_PAGE,
        waitUntil: ["domcontentloaded", "load", "networkidle2"],
      });

      const priceItem = await getPrice(page);
      if (priceItem >= 250 || priceItem === null) {
        logger.warn(
          `[${itemId}] Giá ${priceItem} quá cao hoặc giỏ còn quá ít. Bỏ qua mặt hàng.`
        );
        await removeItemFromCart(page);
        await updateItem(itemId);
        continue;
      }

      logger.info(`[${itemId}] Giá: ${priceItem}. Điều chỉnh số lượng...`);
      const totalCount = calculateAdditions(priceItem, MAX_COUNT_ORDER);
      await adjustItemQuantity(page, totalCount);
      price = await getPrice(page);
      await Promise.all([
        clickElement(page, DOM_SUBSCRIPTION.BUTTON_CHECKOUT, 15, 0.8),
        waitForPageLoad(page),
      ]);
      orderSuccess = true;
      logger.info(`[${itemId}] Đặt đơn thành công với tổng giá: $${price}`);
    } catch (error) {
      logger.error(`Lỗi khi xử lý mặt hàng ${itemId}: ${error.message}`);
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
    await page.mouse.move(250, 250);
    await page.mouse.wheel({ deltaY: 320 });
    return true;
  } catch (error) {
    logger.error(`Lỗi tải trang cho mặt hàng ${itemId}: ${error.message}`);
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
  try {
    await clickElement(page, DOM_SUBSCRIPTION.CLICK_SUB);
    await delay(2);
    await clickElement(page, DOM_SUBSCRIPTION.SET_WEEK, 20);
    await delay(2);
    await page.mouse.move(250, 250);
    await page.mouse.wheel({ deltaY: 320 });
    await clickElement(page, DOM_SUBSCRIPTION.BUTTON_SUB_CART, 15);

    const check = await Promise.race([
      checkElementExits(page, DOM_SUBSCRIPTION.SET_UP_DIALOG, 10),
      checkXpathExits(page, DOM_SUBSCRIPTION.OUT_OF_STOCK, 10),
      checkElementExits(page, DOM_SUBSCRIPTION.CHECK_ORDER_PLACE, 10),
    ]);
    return check.selector === DOM_SUBSCRIPTION.CHECK_ORDER_PLACE;
  } catch (error) {
    logger.error(`Lỗi khởi tạo đăng ký: ${error.message}`);
    return false;
  }
};

const removeItemFromCart = async (page) => {
  try {
    await clickByXPath(page, DOM_SUBSCRIPTION.BUTTON_REMOVE, 0, 10);
    await delay(2);
    logger.info("Đã loại bỏ sản phẩm khỏi giỏ hàng.");
  } catch (error) {
    logger.error(`Lỗi khi loại bỏ sản phẩm khỏi giỏ: ${error.message}`);
  }
};

const adjustItemQuantity = async (page, totalCount) => {
  const count = Math.min(totalCount, MAX_ITEM_ORDER);
  logger.info(`Điều chỉnh số lượng đến ${count}`);
  for (let i = 1; i < count; i++) {
    await clickByXPath(page, DOM_SUBSCRIPTION.QUANTITY_INCREASE, 0, 10);
  }
};

const checkOnlyItem = async (page) => {
  const result = await checkXpathExits(
    page,
    "//span[contains(text(), 'Only ') and contains(text(), ' left')]"
  );
  return result.isShow;
};

const getPrice = async (page) => {
  const check = await Promise.race([
    checkXpathExits(page, DOM_SUBSCRIPTION.TEXT_PRICE_GREEN, 15),
    checkXpathExits(page, DOM_SUBSCRIPTION.TEXT_PRICE_BLACK, 15),
    checkXpathExits(page, DOM_SUBSCRIPTION.WARNING_ITEM, 15),
  ]);
  switch (check.selector) {
    case DOM_SUBSCRIPTION.TEXT_PRICE_GREEN:
      return await greenPrice(page);
    case DOM_SUBSCRIPTION.TEXT_PRICE_BLACK:
      return await blackPrice(page);
    case DOM_SUBSCRIPTION.WARNING_ITEM:
      logger.warn("Sản phẩm đã hết hàng.");
      return null;
    default:
      return null;
  }
};

const blackPrice = async (page) => {
  return await page.evaluate(() => {
    const xpath = '//div[@data-testid="line-price"][contains(@class, "black")]';
    const element = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    return element ? Number(element.innerText.replace("$", "").trim()) : null;
  });
};
const greenPrice = async (page) => {
  return await page.evaluate(() => {
    const xpath = '//div[@data-testid="line-price"][contains(@class, "green")]';
    const element = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    return element ? Number(element.innerText.replace("$", "").trim()) : null;
  });
};

export { subcriptionsItem };
