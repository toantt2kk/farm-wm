import _ from "lodash";
import HttpClient from "../helpers/axios.js";
import { URL_API_PHONE } from "../utils/contants.js";
import { extractCode, extractUSPhoneNumber } from "../utils/helpers.js";

const getPhone = async (maxPrice = 5.5, idServices = "wr") => {
  const url = _.join(
    [
      URL_API_PHONE,
      "&action=getNumber",
      `&service=${idServices}`,
      `&max_price=${maxPrice}`,
    ],
    ""
  );
  const apiClient = new HttpClient();
  const response = await apiClient.get(url);
  // NO_NUMBERS | NO_MONEY | TOO_MANY_ACTIVE_RENTALS
  return extractUSPhoneNumber(response);
};

const cancellingPhone = async (phoneId) => {
  const url = _.join(
    [URL_API_PHONE, `&action=setStatus`, `&id=${phoneId}`, `&status=8`],
    ""
  );
  const apiClient = new HttpClient();
  const response = await apiClient.get(url);
  return response;
};

const getCodePhone = async (phoneId) => {
  const url = _.join(
    [URL_API_PHONE, "&action=getStatus", `&id=${phoneId}`],
    ""
  );
  const apiClient = new HttpClient();
  const response = await apiClient.get(url);
  // RESPONSE: STATUS_WAIT_CODE | STATUS_OK:CODE | NO_ACTIVATION
  return extractCode(response);
};

/**
 * Đặt thời gian chờ 1 phút trong đó cứ 5 giây tạo 1 request.kiểm tra code
 * */

export { cancellingPhone, getCodePhone, getPhone };
