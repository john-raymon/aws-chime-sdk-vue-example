import Vue from "vue";
import App from "./App.vue";
import VueRouter from "vue-router";
import router from "./routes";
import globalComponentInstaller from "@/plugins/globalComponentInstaller";
import DefaultLayout from "@/layout/DefaultLayout";
import ApiAgent from "@/plugins/agents";
import store from "@/vuex";
import "./assets/tailwind.css";

Vue.use(VueRouter);

// globally register layout components
Vue.use(globalComponentInstaller, {
  components: [["default-layout", DefaultLayout]]
});

Vue.mixin({
  beforeCreate() {
    this.$http = new ApiAgent("/api");
  }
});

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
  router,
  store
}).$mount("#app");
