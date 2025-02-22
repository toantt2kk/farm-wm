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
