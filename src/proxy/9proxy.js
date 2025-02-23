import _ from "lodash";
import HttpClient from "../helpers/axios.js";

export const getPorts = async (concurrency) => {
  try {
    const url = `http://127.0.0.1:10101/api/proxy?t=2&num=${concurrency}&country=US&state=New York&start_port=60000`;
    const apiClient = new HttpClient();
    const response = await apiClient.get(url);
    console.log("🚀 ~ getPorts ~ response:", response);
    return response.data.map((ip) => ({
      ip,
      port: parseInt(ip.split(":")[1]),
    }));
  } catch (error) {
    console.error("Error fetching proxy:", error);
    return null;
  }
};

export const checkPorts9Proxy = async (ports) => {
  try {
    const url = `http://127.0.0.1:10101/api/port_check?t=2&ports=${_.join(
      ports,
      ","
    )}`;
    const apiClient = new HttpClient();
    const response = await apiClient.get(url);
    console.log("🚀 ~ checkPorts9Proxy ~ response:", response);
    return response.data;
  } catch (error) {
    console.error("Error fetching proxy:", error);
    return null;
  }
};

export const getToDayProxies = async (
  state = "New York",
  country_code = "US"
) => {
  try {
    // const ports = await checkPorts9Proxy(port);
    // const checkp = _.some(ports, (p) => {
    //   p.port === port && p.online === true;
    // });
    // if (!checkp) {
    //   throw new Error("No available proxy");
    // }
    const url = `http://127.0.0.1:10101/api/today_list?t=2&limit=300&today`;
    const apiClient = new HttpClient();
    const response = await apiClient.get(url);
    const datas = _.filter(
      response.data,
      (proxy) =>
        proxy.country_code === country_code &&
        proxy.city === state &&
        binding === null
    );
    const pickProxyId = _.sample(datas)?.id;
    return pickProxyId ?? null;
  } catch (error) {
    console.error("Error fetching proxy:", error);
    return null;
  }
};

export const _9ProxyForward = async (port) => {
  try {
    const url = `http://127.0.0.1:10101/api/proxy?t=2&num=1&country=US&state=New%20York&isp=Charter%20Business%20Customers,Charter%20Communications,Charter%20Communications,%20INC,Charter%20Communications%20INC,Charter%20Communications%20LLC,T-Mobile%20USA%20Inc.,T-mobile%20Usa,%20Inc.&start_port=${port}`;
    const apiClient = new HttpClient();
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.log("🚀 ~ const_9ProxyForward= ~ error:", error);
  }
  return false;
};
// export const _9ProxyForward = async (
//   port,
//   state = "New York",
//   country_code = "US"
// ) => {
//   try {
//     const idSock = await getToDayProxies(state, country_code);
//     if (!idSock) {
//       throw new Error("No available proxy");
//     }
//     const url = `http://127.0.0.1:10101/api/forward?id=${idSock}&port=${port}&t=2`;
//     const apiClient = new HttpClient();
//     const response = await apiClient.get(url);
//     return response.data;
//   } catch (error) {
//     console.log("🚀 ~ const_9ProxyForward= ~ error:", error);
//   }
//   return false;
// };

export const randomProxy = async (concurrency) => {
  try {
    const ports = await getPorts(concurrency);
    console.log("🚀 ~ randomProxy ~ ports:", ports);
    const checkPorts = await checkPorts9Proxy(_.map(ports, "port"));
    console.log("🚀 ~ randomProxy ~ checkPorts:", checkPorts);
    const validPorts = checkPorts.filter((port) => port.online === false);
    // if (validPorts.length === 0) {
    //   throw new Error("No available proxy");
    // }
    // for await (const port of validPorts) {
    //   const url = `http://127.0.0.1:10101/api/forward?t=2&today&id=proxy_id_from_today_list&Port=60000`;
    //   const apiClient = new HttpClient();
    //   const response = await apiClient.get(url);
    //   console.log("🚀 ~ forawait ~ response:", response);
    // }
    return ports;
  } catch (error) {
    console.log("🚀 ~ randomProxy ~ error:", error);
  }
};
