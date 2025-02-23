import _ from "lodash";

export function calculateChromePositions(
  screenWidth,
  screenHeight,
  numInstances,
  spacing = 0
) {
  if (numInstances <= 0) return [];

  // Tìm số cột và số hàng tối ưu bằng thuật toán CSS Grid
  const maxCols = 10;
  const cols = Math.min(
    maxCols,
    numInstances > maxCols ? maxCols : numInstances
  );
  const rows = Math.ceil(numInstances / cols);

  // Kích thước cửa sổ tính theo số hàng, số cột
  const winWidth = Math.floor((screenWidth - (cols - 1) * spacing) / cols);
  const winHeight = Math.floor((screenHeight - (rows - 1) * spacing) / rows);

  const scaleFactor = _.round(_.min([winWidth / 1920, winHeight / 1080]), 2);

  return _.chain(_.range(numInstances))
    .map((i) => ({ row: Math.floor(i / cols), col: i % cols }))
    .map(({ row, col }) => ({
      x: col * (winWidth + spacing),
      y: row * (winHeight + spacing),
      width: winWidth,
      height: winHeight,
      scale: scaleFactor,
    }))
    .value();
}
export const calculateScaleFactor = (screenWidth, screenHeight, cols, rows) => {
  const desiredWindowWidth = screenWidth / cols;
  const desiredWindowHeight = screenHeight / rows;
  const scaleFactor = Math.min(
    desiredWindowWidth / 1800,
    desiredWindowHeight / 1000
  );
  return scaleFactor;
};
export const calculateRowsCols = (screenWidth, screenHeight, scaleFactor) => {
  const minWindowWidth = 1800 * scaleFactor;
  const minWindowHeight = 1000 * scaleFactor;
  const cols = Math.max(1, Math.floor(screenWidth / minWindowWidth));
  const rows = Math.max(1, Math.floor(screenHeight / minWindowHeight));
  return { cols, rows };
};
export const setChromeWindows = (
  rows,
  cols,
  screenWidth,
  screenHeight,
  scaleFactor
) => {
  const windowWidth = Math.floor(screenWidth / cols);
  const windowHeight = Math.floor(screenHeight / rows);
  const chromePositions = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * windowWidth;
      const y = row * windowHeight;
      chromePositions.push({
        x: Math.floor(x / scaleFactor),
        y: Math.floor(y / scaleFactor),
        width: Math.floor(windowWidth / scaleFactor),
        height: Math.floor(windowHeight / scaleFactor),
      });
    }
  }
  return chromePositions;
};
