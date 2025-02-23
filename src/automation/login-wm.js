import { getCodeFromEmail } from "../mail/mail.js";
import { cancellingPhone, getCodePhone, getPhone } from "../phone/phone.js";
import {
  DOMAIN_EMAIL,
  NAME_USER,
  TIMEOUT_REQUEST_PAGE,
  URL_LOGIN_WM,
  URL_REG_NO_PHONE,
  USER_STATE,
} from "../utils/contants.js";
import { delay } from "../utils/helpers.js";
import { logger } from "../utils/logger.js";
import { generateEmail, generatePhone } from "../utils/random-data.js";
import {
  checkElementExits,
  checkXpathExits,
  clickByXPath,
  clickElement,
  enterKey,
  typeText,
  waitForPageLoad,
} from "./utils/helpers.js";

const MAX_RETRIES_REGISTER = 5;

const SELECTORS = {
  emailInput: 'div[data-testid="auth-phone-or-email-field"] input[type="text"]',
  form: "#sign-up-form",
  firstName: 'input[name="firstName"]',
  lastName: 'input[name="lastName"]',
  phoneNumber: 'input[name="phoneNumber"]',
  password: 'input[name="newPassword"]',
  password_re_enter: 'input[name="password"][autocomplete="current-password"]',
  otpInput: 'input[inputmode="numeric"]',
  submitButton: 'button[type="submit"]',
  createAccount: ".create-account a",
  sendCode: '//button[contains(text(), "Send code")]',
  inputSearch: 'input[data-automation-id="header-input-search"]',
};

const enterEmail = async (page, email) => {
  const element = await Promise.race([
    checkElementExits(page, ".re-captcha", 25),
    checkElementExits(page, SELECTORS.emailInput, 25),
  ]);
  if (element.selector === SELECTORS.emailInput) {
    logger.info(`[Đang nhập email] Nhập email: ${email}`);
    await typeText(page, SELECTORS.emailInput, email);
  } else {
    logger.error("[Lỗi] Không tìm thấy trường nhập email. Thoát.");
    process.exit(1);
  }
  await Promise.all([enterKey(page), waitForPageLoad(page)]);
};

const enterFormInfo = async (
  page,
  { firstName, lastName, phone, password },
  type = "NONE"
) => {
  await page.waitForSelector(SELECTORS.form);
  logger.info("[Thông tin] Điền thông tin form đăng ký");
  await typeText(page, SELECTORS.firstName, firstName);
  await typeText(page, SELECTORS.lastName, lastName);
  if (type === "NONE") {
    await typeText(page, SELECTORS.phoneNumber, phone);
  }
  await typeText(page, SELECTORS.password, password);
  await Promise.all([enterKey(page), waitForPageLoad(page)]);
};

const enterCode = async (page, code) => {
  logger.info("[Thông tin] Nhập mã OTP");
  const otpInputVisible = await page.waitForSelector(SELECTORS.otpInput, {
    visible: true,
    timeout: 5000,
  });
  if (otpInputVisible) {
    const inputs = await page.$$(SELECTORS.otpInput);
    if (inputs.length === 0) throw new Error("Không tìm thấy ô nhập OTP");
    for (let i = 0; i < code.length; i++) {
      await inputs[i].type(code[i], { delay: 36 });
    }
    await Promise.all([enterKey(page), waitForPageLoad(page)]);
  }
};

const waitingCode = async (timeout, getCodeFunc) => {
  const start = Date.now();
  logger.info(`[Thông tin] Đang chờ mã trong ${timeout} giây...`);
  while (Date.now() - start < timeout * 1000) {
    const code = await getCodeFunc();
    if (code) {
      logger.info("[Thông tin] Nhận được mã OTP");
      return code.trim();
    }
    await delay(5);
  }
  logger.error("[Lỗi] Hết thời gian chờ mã OTP");
  return null;
};

const loginWm = async (page, info) => {
  try {
    logger.info(`[Đăng nhập WM] Truy cập ${URL_LOGIN_WM}`);
    await page.goto(URL_LOGIN_WM, {
      timeout: TIMEOUT_REQUEST_PAGE,
      waitUntil: "domcontentloaded",
    });
    await enterEmail(page, info.email);
    await enterFormInfo(page, info);

    const codeEmail = await waitingCode(60, () => getCodeFromEmail(info.email));
    if (!codeEmail) return "NO_CODE_MAIL";
    await enterCode(page, codeEmail);

    const codePhone = await waitingCode(60, () => getCodePhone(info.phoneId));
    if (!codePhone) {
      logger.error("[Lỗi] Không nhận được mã OTP từ điện thoại");
      await cancellingPhone(info.phoneId);
      return "NO_CODE_PHONE";
    }
    await enterCode(page, codePhone);
    await waitForPageLoad(page);
    logger.info("[Thành công] Đăng nhập WM thành công");
    return "SUCCESS";
  } catch (error) {
    logger.error(`[Lỗi đăng nhập WM] ${error}`);
    await cancellingPhone(info.phoneId);
    return "SERVER_ERROR";
  }
};

const loginWmNoPhone = async (page, info) => {
  logger.info(
    `[Đăng ký không cần điện thoại] Thông tin tài khoản: ${JSON.stringify(
      info
    )}`
  );
  try {
    logger.info(`[Đăng ký không cần điện thoại] Truy cập ${URL_REG_NO_PHONE}`);
    await page.goto(URL_REG_NO_PHONE, {
      timeout: TIMEOUT_REQUEST_PAGE,
      waitUntil: ["domcontentloaded", "networkidle2"],
    });
    // await clickElement(page, SELECTORS.createAccount, 25);
    await Promise.all([
      clickElement(page, SELECTORS.createAccount, 25),
      waitForPageLoad(page),
    ]);
    await enterEmail(page, info.email);
    await enterFormInfo(page, info, "NO_PHONE");

    const codeEmail = await waitingCode(60, () => getCodeFromEmail(info.email));
    if (!codeEmail) return "NO_CODE_MAIL";
    await enterCode(page, codeEmail);

    await delay(5);
    logger.info(`[Đăng ký không cần điện thoại] Chuyển đến ${URL_LOGIN_WM}`);
    await page.goto(URL_LOGIN_WM, {
      timeout: TIMEOUT_REQUEST_PAGE,
      waitUntil: ["domcontentloaded", "networkidle2"],
    });
    await enterEmail(page, info.email);
    await typeText(page, SELECTORS.password_re_enter, info.password);
    await Promise.all([enterKey(page), waitForPageLoad(page)]);
    const checked = await Promise.race([
      checkXpathExits(page, SELECTORS.sendCode, 25),
      checkElementExits(page, SELECTORS.inputSearch, 25),
    ]);
    if (checked.selector === SELECTORS.sendCode) {
      logger.info("[Thông tin] Gửi lại mã OTP qua email");
      await clickByXPath(page, SELECTORS.sendCode, 0, 25);
      const newCodeEmail = await waitingCode(60, () =>
        getCodeFromEmail(info.email)
      );
      if (!newCodeEmail) return "NO_CODE_MAIL";
      await enterCode(page, newCodeEmail);
    }
    logger.info("[Thành công] Đăng ký không cần điện thoại thành công");
    return "SUCCESS";
  } catch (error) {
    logger.error(`[Lỗi đăng ký không cần điện thoại] ${error}`);
    return "SERVER_ERROR";
  }
};

const loginType = "NO_PHONE"; // hoặc "NONE"
const processLogin = async (page, info) => {
  let retriesRegister = 0;
  let statusLogin;
  while (retriesRegister < MAX_RETRIES_REGISTER && statusLogin !== "SUCCESS") {
    retriesRegister++;
    logger.info(`[Quá trình đăng nhập] Lần thử ${retriesRegister}`);

    if (statusLogin === "NO_CODE_MAIL") {
      info = generateEmail(NAME_USER, USER_STATE, DOMAIN_EMAIL);
      logger.info(`[Cập nhật] Email mới: ${info.email}`);
    }

    if (loginType === "NO_PHONE") {
      Object.assign(info, { phone: generatePhone(), phoneId: null });
      statusLogin = await loginWmNoPhone(page, info);
    } else {
      const phone = await getPhone();
      Object.assign(info, { phone: phone.phone, phoneId: phone.id });
      statusLogin = await loginWm(page, info);
    }

    if (statusLogin === "NO_CODE_PHONE" || statusLogin === "NO_CODE_MAIL") {
      logger.warn(`[Cảnh báo] ${statusLogin}. Quay lại trang để thử lại.`);
      await page.goBack({
        timeout: TIMEOUT_REQUEST_PAGE,
        waitUntil: ["load", "domcontentloaded"],
      });
      continue;
    }
    if (statusLogin === "SERVER_ERROR") {
      logger.error("[Lỗi] Server error, dừng thử lại.");
      break;
    }
  }
  logger.info(`[Kết quả] processLogin: ${statusLogin}`);
  return statusLogin;
};

export { processLogin };
