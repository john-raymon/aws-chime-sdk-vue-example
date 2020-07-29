import superagent from "superagent";
import localforage from "localforage";
import axios from "axios";
import qs from "qs";

class Agent {
  // TODO: maybe package into small helper superagent auth lib.
  constructor(API_ROOT = "/") {
    this.API_ROOT = API_ROOT;
    this.superagent = superagent;
    this.axios = axios;
    this.axios.interceptors.request.use(async function(config) {
      const token = await Agent.getToken();
      config.headers.Authorization = `Token ${token}`;
      return config;
    });
  }

  static getToken() {
    // gets the token from local-storage
    return localforage.getItem("jwt");
  }

  static setToken(token) {
    // sets token in local-storage
    return localforage.setItem("jwt", token);
  }

  async _tokenPlugin(req) {
    /**
     * plugin superagent uses before each request,
     *  using static method getToken to get token
     * and set in it the header
     * */
    try {
      this.token = await Agent.getToken();
      req.set("Authorization", `Token ${this.token || ""}`);
      return req;
    } catch (error) {
      console.log("Error while fetching token from storage.", error);
      return req;
    }
  }

  async _responseBody(res) {
    const { accessToken } = res.data.user || res.data.merchant || {};
    if (accessToken) {
      // set in local-storage, so that on next request it's
      // attached in header
      await Agent.setToken(accessToken);
    }
    return res.data;
  }

  _del(url) {
    return this.superagent.del(`${this.API_ROOT}${url}`).then(this._responseBody);
  }

  _get(url, fullPath = false, query = {}) {
    return axios
      .get(fullPath ? url : `${this.API_ROOT}${url}`, qs.stringify(query))
      .then(this._responseBody);
  }

  _patch(url, body) {
    return this.superagent.patch(`${this.API_ROOT}${url}`, body).then(this._responseBody);
  }

  _post(url, body, fullPath = false) {
    return axios.post(fullPath ? url : `${this.API_ROOT}${url}`, body).then(this._responseBody);
  }
}

export default Agent;
