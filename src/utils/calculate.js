import _ from "lodash";

const calculateAdditions = (price, maxTotal = 250) => {
  if (!_.isNumber(price) || price <= 0) return 0;
  const total = Math.floor(maxTotal / price);
  return total <= 12 ? total : 12;
};
export { calculateAdditions };
