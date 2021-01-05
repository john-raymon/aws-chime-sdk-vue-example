import Vue from "vue";
import Vuex from "vuex";
import VuexPersistence from "vuex-persist";
import Agent from "@/plugins/agents";

Vue.use(Vuex);

// persist user state accross refreshes and what-not
const persist = new VuexPersistence();

export default new Vuex.Store({
  state: {
    userAuth: {
      isAuth: false,
      user: null
    }
  },
  mutations: {
    setUserAuth(state, userAuth) {
      state.userAuth = { ...userAuth, user: { ...userAuth.user, accessToken: undefined } };
    },
    resetAuth(state) {
      state.userAuth = {
        isAuth: false,
        user: null
      };
    }
  },
  actions: {
    updateUserAuth(context, authData) {
      context.commit("setUserAuth", authData);
    },
    logout(context) {
      // clear jwt from localforage
      Agent.setToken("");
      return context.commit("resetAuth");
    }
  },
  plugins: [persist.plugin]
});
