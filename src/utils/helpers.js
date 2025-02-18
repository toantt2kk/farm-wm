import _ from "lodash";

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
}
export const extractUSPhoneNumber = (input) => {
  const match = input.match(/ACCESS_NUMBER:(\d+):(\d{11})/);
  if (match) {
    const id = match[1];
    let phone = match[2];
    if (phone.startsWith("1")) {
      phone = phone.substring(1);
    }
    return { id, phone };
  }
  return null;
};

export const extractCode = (input) => {
  const match = input.match(/STATUS_OK:(\d+)/);
  return match ? match[1] : null;
};

export const pickAndRemove = (arr) => {
  const item = _.sample(arr);
  _.remove(arr, item);
  return item;
};
