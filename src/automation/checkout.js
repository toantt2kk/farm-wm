import { readRandomUnusedCI, updateCi } from "../database/models/ci.js";
import { upsertSuccesses } from "../database/models/success.js";
import { getFirstChar } from "../utils/formater.js";
import { delay, sleeptime } from "../utils/helpers.js";
import { logger } from "../utils/logger.js";
import {
  checkElementExits,
  checkXpathExits,
  clickByXPath,
  clickElement,
  enterKey,
  typeText,
} from "./utils/helpers.js";

const DOM_CHECKOUT = {
  SHIPPING_HEADER: "#shipping-card-header",
  HAS_ADDRESS: '#shipping-card-header i[data-testid="icon-CheckCircleFill"]',
  FORM_ADDRESS: "form#add-edit-address-form",
  FIRSTNAME: 'input[name="firstName"]',
  LASTNAME: 'input[name="lastName"]',
  PHONE: 'input[name="phone"]',
  STREET_ADDRESS: "#addressLineOne",
  APT: 'input[name="addressLineTwo"]',
  CITY: 'input[name="city"]',
  STATE: 'select[name="state"]',
  NO_TKS_WM: '//button[contains(text(), "No thanks")]',
  ZIP: 'input[name="postalCode"]',
  BUTTON_NO_SAVE: "//button[contains(text(), 'No, save')]",
  I_AGREE: "#subscription-terms-field",
  PAYMENT_FORM: "form#single-form-add-payment",
  CC_NUMBER: "#cc-number",
  MONTH: 'select[autocomplete="cc-exp-month"]',
  YEAR: 'select[autocomplete="cc-exp-year"]',
  CVV: 'input[name="cvv"]',
  CHANGE_PAYMENT: 'button[data-testid="edit-payment-button"]',
  CLOSE_DIALOG_CHANGE_PAYMENT:
    'button[aria-label="close change payment panel"]',
  DIALOG_FORM_PAYMENT: 'div[role="dialog"] #single-form-add-payment',
  DELETE_CARD: 'button[data-automation-id="delete"]',
  EXPIRATION_CVV:
    "//span[contains(text(), 'CVV and expiration date and try again')]",
  PLEASE_ENTER_CVV: '//span[contains(text(), "warning:")]',
  ADDCARD_SUCCESS:
    '#payments-card-header i[data-testid="icon-CheckCircleFill"]',
  ERROR_CARD_AUTH: 'div[aria-label="Error"]',
  SUBMIT_PAYMENT: '[form="single-form-add-payment"]',
  CONTINUE: '//button[contains(text(), "Continue")]',
  LEAVE: '//button[contains(text(), "Continue")]',
  NO_ADD_PAYMENT:
    "//*[contains(text(), 'Your card could not be saved. Please use a different payment method')]",
  BUTTON_ORDER_PLACE: 'button[data-automation-id="place-order-button"]',
};

const checkoutProcess = async (page, info, price) => {
  try {
    logger.info("[Checkout] Nhấn 'No thanks'");
    await clickByXPath(page, DOM_CHECKOUT.NO_TKS_WM);
    const isEnterAddress = await addAddress(page, info);
    if (!isEnterAddress) {
      logger.warn("[Checkout] Không nhập địa chỉ được.");
      return false;
    }
    await acceptMoveOn(page);
    let status = "CVV_ERROR";
    while (
      status === "CVV_ERROR" ||
      status === "RE_ENTER" ||
      status === "LIMIT_MONEY"
    ) {
      await sleeptime(3, 5);
      const cardInfo = await readRandomUnusedCI();
      if (!cardInfo) {
        logger.error("[Checkout] Hết thẻ CI để thử.");
        break;
      }
      logger.info(`[Checkout] Đang thử thẻ: ${cardInfo.cc_number}`);
      await enterCardInfo(page, cardInfo);
      status = await checkCVVLive(page);

      switch (status) {
        case "RE_ENTER":
          logger.warn("[Checkout] Yêu cầu nhập lại CVV. Loại thẻ hiện tại.");
          await clickElement(page, DOM_CHECKOUT.CHANGE_PAYMENT, 25);
          await removeCard(page);
          await acceptMoveOn(page);
          await updateCi(cardInfo.id, "error");
          continue;
        case "CVV_ERROR":
          logger.warn("[Checkout] CVV không đúng. Loại thẻ.");
          await updateCi(cardInfo.id, "error");
          continue;
        case "NO_ADD":
          logger.warn("[Checkout] Không thêm được thẻ.");
          break;
        case "SUCCESS":
          logger.info("[Checkout] Thẻ hợp lệ, đặt đơn hàng...");
          await clickElement(page, DOM_CHECKOUT.BUTTON_ORDER_PLACE, 25);
          const { isShow } = await checkElementExits(
            page,
            DOM_CHECKOUT.ERROR_CARD_AUTH,
            15
          );
          if (isShow) {
            logger.warn("[Checkout] Lỗi xác thực thẻ, giới hạn tiền.");
            status = "LIMIT_MONEY";
            await removeCard(page);
            await delay(999);
            await acceptMoveOn(page);
            await updateCi(cardInfo.id, "error");
            continue;
          } else {
            await updateCi(cardInfo.id, "used");
            await upsertSuccesses([
              {
                email: info.email,
                price: price,
              },
            ]);
          }
          break;
        default:
          logger.warn(`[Checkout] Trạng thái không xác định: ${status}`);
          break;
      }
      // Nếu status là NO_ADD hoặc SUCCESS, thoát vòng lặp
      if (status === "NO_ADD" || status === "SUCCESS") break;
    }

    if (status === "NO_ADD") {
      logger.error("[Checkout] Không thêm được thẻ, đặt đơn thất bại.");
      return false;
    }
    logger.info("[Checkout] Đặt đơn thành công!");
    return true;
  } catch (error) {
    logger.error(`[Checkout] Lỗi trong quá trình đặt đơn: ${error.message}`);
  }
  return false;
};

const removeCard = async (page) => {
  try {
    logger.info("[Checkout] Xóa thẻ hiện tại.");
    await clickElement(page, DOM_CHECKOUT.DELETE_CARD, 25);
    const elements = await page.$$(
      `::-p-xpath(//button[contains(text(), "Confirm")])`
    );
    if (elements.length === 0) {
      logger.warn("[Checkout] Không tìm thấy nút xác nhận xóa thẻ.");
      return false;
    }
    // Giả sử nút thứ 2 là nút Confirm
    await elements[1].click();
    await sleeptime(1, 3);
    await clickByXPath(page, DOM_CHECKOUT.LEAVE, 25);
    await sleeptime(1, 3);
    await page.reload({
      waitUntil: ["domcontentloaded"],
      timeout: TIMEOUT_REQUEST_PAGE,
    });
    return true;
  } catch (error) {
    logger.error(`[Checkout] Lỗi khi xóa thẻ: ${error.message}`);
    return false;
  }
};

const enterCardInfo = async (page, infoCard, parent) => {
  let ccNumber = DOM_CHECKOUT.CC_NUMBER;
  let month = DOM_CHECKOUT.MONTH;
  let year = DOM_CHECKOUT.YEAR;
  let cvv = DOM_CHECKOUT.CVV;
  if (parent) {
    ccNumber = `${parent} ${DOM_CHECKOUT.CC_NUMBER}`;
    month = `${parent} ${DOM_CHECKOUT.MONTH}`;
    year = `${parent} ${DOM_CHECKOUT.YEAR}`;
    cvv = `${parent} ${DOM_CHECKOUT.CVV}`;
  }
  logger.info(`[Checkout] Nhập thông tin thẻ: ${infoCard.cc_number}`);
  await typeText(page, ccNumber, infoCard.cc_number);

  const { isShow } = await checkElementExits(page, month, 25);
  if (!isShow) {
    logger.error("[Checkout] Không tìm thấy selector cho tháng hết hạn.");
    return false;
  }
  await page.select(month, infoCard.month);
  await page.select(year, infoCard.year);
  await page.evaluate(() => {
    const inputElement = document.querySelector('input[name="cvv"]');
    if (inputElement) {
      inputElement.setAttribute("maxlength", "4");
    }
  });
  await typeText(page, cvv, infoCard.cvv);
  await delay(5);
  if (parent) {
    await clickElement(page, DOM_CHECKOUT.SUBMIT_PAYMENT);
  } else {
    await clickByXPath(page, DOM_CHECKOUT.CONTINUE);
  }
};

const checkCVVLive = async (page) => {
  const { isShow: pleaseEnter } = await checkXpathExits(
    page,
    DOM_CHECKOUT.PLEASE_ENTER_CVV,
    10
  );
  if (pleaseEnter) {
    logger.info("[Checkout] Yêu cầu nhập lại CVV.");
    return "RE_ENTER";
  }
  const check = await Promise.race([
    checkXpathExits(page, DOM_CHECKOUT.EXPIRATION_CVV, 15),
    checkXpathExits(page, DOM_CHECKOUT.NO_ADD_PAYMENT, 15),
    checkElementExits(page, DOM_CHECKOUT.ADDCARD_SUCCESS, 15),
  ]);
  switch (check.selector) {
    case DOM_CHECKOUT.EXPIRATION_CVV:
      logger.warn("[Checkout] CVV hoặc hạn thẻ không hợp lệ.");
      return "CVV_ERROR";
    case DOM_CHECKOUT.NO_ADD_PAYMENT:
      logger.warn("[Checkout] Không thêm được thẻ.");
      return "NO_ADD";
    case DOM_CHECKOUT.ADDCARD_SUCCESS:
      logger.info("[Checkout] Thẻ hợp lệ.");
      return "SUCCESS";
    default:
      logger.warn("[Checkout] Không nhận diện được trạng thái thẻ.");
      return "CVV_ERROR";
  }
};

const enterFormAddress = async (page, info) => {
  logger.info("[Checkout] Nhập thông tin địa chỉ giao hàng.");
  await typeText(page, DOM_CHECKOUT.FIRSTNAME, info.firstName);
  await typeText(page, DOM_CHECKOUT.LASTNAME, info.lastName);
  await typeText(
    page,
    DOM_CHECKOUT.STREET_ADDRESS,
    `24${getFirstChar(info.firstName)}${getFirstChar(
      info.lastName
    )} Holly Road #${info.firstName}`
  );
  await typeText(page, DOM_CHECKOUT.APT, "apt 0");
  await typeText(page, DOM_CHECKOUT.CITY, "Ronkonkoma");
  await page.select(DOM_CHECKOUT.STATE, "NY");
  await typeText(page, DOM_CHECKOUT.ZIP, "11779");
  await typeText(page, DOM_CHECKOUT.PHONE, info.phone);
  await delay(1);
  await enterKey(page);
  await delay(2);
  await clickByXPath(page, DOM_CHECKOUT.BUTTON_NO_SAVE, 15);
};

const acceptMoveOn = async (page) => {
  logger.info("[Checkout] Đồng ý điều khoản và tiếp tục.");
  await clickElement(page, DOM_CHECKOUT.I_AGREE, 25);
};

const addAddress = async (page, info) => {
  logger.info("[Checkout] Kiểm tra form địa chỉ.");
  const check = await Promise.race([
    checkElementExits(page, DOM_CHECKOUT.FORM_ADDRESS, 25),
    checkElementExits(page, DOM_CHECKOUT.HAS_ADDRESS, 25),
  ]);
  let success = true;
  switch (check.selector) {
    case DOM_CHECKOUT.FORM_ADDRESS:
      await enterFormAddress(page, info);
      await delay(1);
      break;
    case DOM_CHECKOUT.HAS_ADDRESS:
      logger.info("[Checkout] Địa chỉ đã có sẵn.");
      success = false;
      break;
    default:
      logger.warn("[Checkout] Không nhận diện được form địa chỉ.");
      success = false;
      break;
  }
  return success;
};

export { checkoutProcess };
