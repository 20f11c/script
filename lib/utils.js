/**
 * 用于处理HTTP请求的Request类，带有自动重试机制和代理支持。
 */
const axios = require("axios");
const fs = require('fs');
const { getFreshProxy } = require("./proxyApi");

class utils {
  /**
   * 构造Request对象，传入一个userAgent字符串。
   * @param {string} userAgent - 请求中使用的userAgent字符串。
   */
  constructor(userAgent) {
    this.userAgent = userAgent;
  }

  /**
   * 执行GET请求，具有自动重试和可选代理功能。
   * @param {string} url - 发送请求的目标URL。
   * @param {Object|null} headers - 可选的自定义请求头。
   * @param {boolean} useProxy - 是否为此次请求使用代理。
   * @param {number} retries - 在失败时重试请求的次数。
   * @returns {Promise<Object>} - 从服务器返回的数据。
   */
  async get(url, headers = null, useProxy = false, retries = 3) {
    // 尝试进行请求，最多重试指定次数
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // 构建请求选项
        const options = {
          url,
          method: "get",
          headers: { ...(headers || {}), "User-Agent": this.userAgent },
        };

        // 如果启用了代理，进行配置
        if (useProxy) {
          const proxyConfig = await this.getFreshProxy();
          if (proxyConfig) {
            options.proxy = {
              host: proxyConfig.host,
              port: proxyConfig.port,
              protocol: url.match(/^(http|https):/)[0],
              auth: {
                username: proxyConfig.username,
                password: proxyConfig.password,
              },
            };
          }
        } else {
          options.proxy = null;
        }

        // 发送请求并处理响应
        const response = await axios(options);
        if (response.status === 200) {
          const data = response.data;
          return data;
        } else {
          console.warn(
            `获取数据失败。服务器响应状态码：${response.status}`
          );
        }
      } catch (error) {
        // 记录错误，如果未超出重试限制则重新尝试
        console.error(`代理服务器异常，2秒后尝试重新请求！`);
        if (attempt < retries) {
          console.log(`2秒后重新尝试...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * 执行POST请求，具有自动重试和可选代理功能。
   * @param {string} url - 发送请求的目标URL。
   * @param {Object} data - 请求体中的发送数据。
   * @param {Object|null} headers - 可选的自定义请求头。
   * @param {boolean} useProxy - 是否为此次请求使用代理。
   * @param {number} retries - 在失败时重试请求的次数。
   * @returns {Promise<Object>} - 从服务器返回的数据。
   */
  async post(url, data, headers = null, useProxy = false, retries = 3) {
    // 尝试进行请求，最多重试指定次数
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // 构建请求选项
        const options = {
          url,
          method: "post",
          data,
          headers: { ...(headers || {}), "User-Agent": this.userAgent },
        };

        // 如果启用了代理，进行配置
        if (useProxy) {
          const proxyConfig = await this.getFreshProxy();
          if (proxyConfig) {
            options.proxy = {
              host: proxyConfig.host,
              port: proxyConfig.port,
              protocol: url.match(/^(http|https):/)[0],
              auth: {
                username: proxyConfig.username,
                password: proxyConfig.password,
              },
            };
          }
        } else {
          options.proxy = null;
        }

        // 发送请求并处理响应
        const response = await axios(options);
        if (response.status === 200) {
          const responseData = response.data;
          return responseData;
        } else {
          console.warn(
            `发送数据失败。服务器响应状态码：${response.status}`
          );
        }
      } catch (error) {
        // 记录错误，如果未超出重试限制则重新尝试
        console.error(`代理服务器异常，2秒后尝试重新请求！`);
        if (attempt < retries) {
          console.log(`2秒后重新尝试...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * 从代理API获取新的代理配置。
   * @returns {Promise<Object|null>} - 代理配置对象，如果无法获取则返回null。
   */
  async getFreshProxy() {
    try {
      const proxyData = await getFreshProxy();
      return {
        host: proxyData.ip,
        port: proxyData.port,
        username: proxyData.http_user,
        password: proxyData.http_pass,
      };
    } catch (error) {
      console.warn(
        "未能获取新鲜的代理，将不使用代理：",
        error
      );
      return null;
    }
  }

  /**
   * 读取并解析包含cookies的JSON文件，返回特定cookie的值。
   * @param {string} keyName - 要检索的cookie键名。
   * @returns {Promise<string|null>} - 指定cookie的值，如果未找到则返回null。
   */
  async cookiearr(keyName){
    const filename = './cookie.json';

    try {
      const data = await fs.promises.readFile(filename, "utf8");
      const jsonData = JSON.parse(data);

      // 查找指定的keyName
      const result = jsonData.cookie.find(cookieGroup => keyName in cookieGroup)?.[keyName];

      if (!result) {
        console.warn(`键"${keyName}"在JSON文件中未找到。`);
      }

      return result;
    } catch (error) {
      console.error(`读取文件时出错：`, error);
      throw new Error(`无法检索键为"${keyName}"的cookie。`);
    }
  };

}

module.exports = utils;