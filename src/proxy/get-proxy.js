import HttpClient from "../helpers/axios.js";

export const getProxy = async (port) => {
  try {
    const url = `http://127.0.0.1:42333/api/get_ip_list?num=1&country=US&state=NewYork&isp=CharterCommunicationsInc&port=${port}`;
    const apiClient = new HttpClient();
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    console.error("Error fetching proxy:", error);
    return null;
  }
};
