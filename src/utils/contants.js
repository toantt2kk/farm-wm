const STATE = "NewYork";
const NAME_USER = "toan";
const USER_STATE = "34";
const DOMAIN_EMAIL = "goku68";
const TOKEN_PHONE = "VjAJ43VS5Lk9pWXx5JzWWYQ5JxRREc";
const TOKEN_GOLOGIN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2IxM2I4MTdlZWEzMjcwNWJmOWY5NDMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2N2IxM2I5NTA3MGJlNzUzNjM4NDY1MGUifQ.m-LuPVoOUfn9DMpCFEWB37RSsVHdVs7UHXHK5mDOnFM";
const URL_API_PHONE = `https://daisysms.com/stubs/handler_api.php?api_key=${TOKEN_PHONE}`;
const TIMEOUT_REQUEST_PAGE = 60 * 1000;
const URL_LOGIN_WM = "https://www.walmart.com/account/profile";
const URL_REG_NO_PHONE = "https://advertising.walmart.com";
const URL_WM = "https://www.walmart.com/";
const MAX_COUNT_ORDER = 220;
const MAX_ITEM_ORDER = 12;
const FILE_ITEM = "./data/item.txt";
const FILE_CI = "./data/ci.txt";
const FILE_TEST = "./data/test.txt";
const FILE_ITEM_STOCK = "./data/item-stock.txt";
const SUCCESS_FILE = "./data/success.txt";
const URL_LOGIN_ACCOUNT = "https://www.walmart.com/account/login";
const PROFILE_PATH = "D:\\profile_gologin";
export {
  DOMAIN_EMAIL,
  FILE_CI,
  FILE_ITEM,
  FILE_ITEM_STOCK,
  FILE_TEST,
  MAX_COUNT_ORDER,
  MAX_ITEM_ORDER,
  NAME_USER,
  PROFILE_PATH,
  STATE,
  SUCCESS_FILE,
  TIMEOUT_REQUEST_PAGE,
  TOKEN_GOLOGIN,
  TOKEN_PHONE,
  URL_API_PHONE,
  URL_LOGIN_ACCOUNT,
  URL_LOGIN_WM,
  URL_REG_NO_PHONE,
  URL_WM,
  USER_STATE,
};
