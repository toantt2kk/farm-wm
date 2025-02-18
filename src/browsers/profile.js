import GoLogin from "gologin/src/gologin.js";
import { TOKEN_GOLOGIN } from "../utils/contants.js";
import { generateRandomName } from "../utils/random-data.js";

const createProfile = async (options) => {
  const GL = new GoLogin({
    token: TOKEN_GOLOGIN,
  });
  return await GL.create({
    ...options,
    name: generateRandomName(),
    navigator: {
      language: "en-US,en;q=0.9",
      userAgent: "random", // get random user agent for selected os
      resolution: "1024x768",
    },
    proxyEnabled: false,
  });
};
export { createProfile };
