import axios from "axios";

class HttpClient {
  constructor(options = {}) {
    this.instance = axios.create({
      baseURL: options.baseURL || undefined,
      timeout: options.timeout || 10000,
      headers: options.headers || { "Content-Type": "application/json" },
    });

    this.instance.interceptors.request.use(
      (config) => {
        // Thêm logic trước khi request được gửi đi (ví dụ: auth token)
        if (options.getToken) {
          const token = options.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    this.instance.interceptors.response.use(
      (response) => response.data,
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  handleError(error) {
    if (error.response) {
      // Lỗi từ server (4xx, 5xx)
      return {
        status: error.response.status,
        message: error.response.data?.message || "Server Error",
        data: error.response.data || null,
      };
    } else if (error.request) {
      // Request đã gửi nhưng không có phản hồi
      return { status: null, message: "No response from server", data: null };
    } else {
      // Lỗi trong quá trình thiết lập request
      return { status: null, message: error.message, data: null };
    }
  }

  get(url, params = {}, config = {}) {
    return this.instance.get(url, { params, ...config });
  }

  post(url, data = {}, config = {}) {
    return this.instance.post(url, data, config);
  }

  put(url, data = {}, config = {}) {
    return this.instance.put(url, data, config);
  }

  delete(url, config = {}) {
    return this.instance.delete(url, config);
  }
}

export default HttpClient;
