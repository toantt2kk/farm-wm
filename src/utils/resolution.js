import _ from "lodash";

export function calculateChromePositions(
  screenWidth,
  screenHeight,
  numInstances,
  spacing = 0
) {
  const findGrid = (n) => {
    let bestGrid = { rows: 1, cols: n };
    let minDiff = Infinity;

    for (let rows = 1; rows <= Math.ceil(Math.sqrt(n)); rows++) {
      let cols = Math.ceil(n / rows);
      let width = Math.floor(screenWidth / cols);
      let height = Math.floor(screenHeight / rows);

      let aspectRatio = width / height;
      let idealRatio = screenWidth / screenHeight;
      let diff = Math.abs(aspectRatio - idealRatio);

      if (diff < minDiff) {
        minDiff = diff;
        bestGrid = { rows, cols };
      }
    }

    return bestGrid;
  };

  const { rows, cols } = findGrid(numInstances);
  let winWidth = Math.floor(screenWidth / cols);
  let winHeight = Math.floor(screenHeight / rows);
  const scaleFactor = _.round(_.min([winWidth / 1920, winHeight / 1080]), 2);
  return _.chain(_.range(numInstances))
    .map((i) => ({
      row: Math.floor(i / cols),
      col: i % cols,
    }))
    .map(({ row, col }) => ({
      x: col * winWidth,
      y: row * winHeight,
      width: winWidth,
      height: winHeight,
      scale: scaleFactor,
    }))
    .value();
}
