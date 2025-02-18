import GoLogin from "gologin/src/gologin.js";
import puppeteer from "puppeteer-core";
import { checkProxy } from "../proxy/checker.js";
import { getProxy } from "../proxy/get-proxy.js";
import { TOKEN_GOLOGIN } from "../utils/contants.js";
const MAX_RETRIES = 5;
const MAX_RETRIES_CONNECT = 5;
const browserRunner = async (profileId) => {
  const GL = new GoLogin({
    token: TOKEN_GOLOGIN,
    profile_id: profileId,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });
  let page = null;
  let browser = null;
  try {
    let retries = 0;
    let success = false;
    while (retries++ < MAX_RETRIES && !success) {
      try {
        const proxy = await getProxy();
        const isLiveProxy = await checkProxy(proxy);
        if (!isLiveProxy) {
          return console.log("Proxy is not live. Skipping login.");
        }
        const { wsUrl } = await GL.start();
        let connectCout = 0;
        let connectSuccess = false;
        while (connectCout++ < MAX_RETRIES_CONNECT && !connectSuccess) {
          try {
            browser = await puppeteer.connect({
              browserWSEndpoint: wsUrl,
              ignoreHTTPSErrors: true,
              defaultViewport: null,
            });
            connectSuccess = true;
          } catch (error) {
            console.error(error);
            continue;
          }
        }
        const pages = await browser.pages();
        if (pages.length > 1) {
          await pages[1].close();
        }
        page = pages[0];
        success = true;
      } catch (error) {
        console.error(error);
        continue;
      }
    }

    return { browser, page: page, GL };
  } catch (error) {
    console.error("Error:", error);
  }
  return { GL, browser, page };
};

export { browserRunner };
