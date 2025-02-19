import _ from "lodash";

export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
};
export const sleeptime = (start, end) => {
  const randomTime = _.random(start * 1000, end * 1000);
  return new Promise((resolve) => setTimeout(resolve, randomTime));
};
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
  const item = _.shuffle(_.sample(arr));
  _.remove(arr, item);
  return item;
};

export const calcScaleFactor = ({
  screenWidth,
  screenHeight,
  cols,
  rows,
  spacing,
  logicWidth,
  logicHeight,
}) => {
  const scaleFactorWidth =
    (screenWidth - (cols - 1) * spacing) / (cols * logicWidth);
  const scaleFactorHeight =
    (screenHeight - (rows - 1) * spacing) / (rows * logicHeight);
  return Math.min(scaleFactorWidth, scaleFactorHeight);
};

export const getWindowsPositions = ({
  rows,
  cols,
  scaledWidth,
  scaledHeight,
  spacing,
}) => {
  const positions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = Math.floor(c * (scaledWidth + spacing));
      const y = Math.floor(r * (scaledHeight + spacing));
      positions.push({ x, y });
    }
  }
  return positions;
};
