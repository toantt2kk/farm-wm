import _ from "lodash";
import { generateRandomNumber } from "./random-data.js";
const formatCard = (str, delimiter) => {
  const [numberCi, month, year] = _.split(str, delimiter);
  return {
    numberCi,
    month,
    year,
    cvv: generateRandomNumber(1000, 9999).toString(),
  };
};
const getFirstChar = (str) => _.first(str);

export { formatCard, getFirstChar };
