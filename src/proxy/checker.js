import axios from "axios";
import { ProxyAgent } from "proxy-agent";

const proxyUrl = "socks5://127.0.0.1:40000";

const checkProxy = async () => {
  try {
    const agent = new ProxyAgent(proxyUrl);
    const response = await axios.get("https://www.google.com", {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 5000,
    });

    console.log("✅ Proxy hoạt động:", response.status);
    return true;
  } catch (error) {
    console.error("❌ Proxy lỗi hoặc không kết nối được:", error.message);
  }
  return false;
};

export { checkProxy };
