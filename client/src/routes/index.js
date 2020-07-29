import VueRouter from "vue-router";
import AuthPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import SignInPage from "@/pages/SignInPage";
import store from "@/vuex";

const routes = [
  {
    name: "home",
    path: "",
    component: HomePage
  },
  {
    name: "sign-up",
    path: "/sign-up",
    component: AuthPage
  },
  {
    name: "sign-in",
    path: "/sign-in",
    component: SignInPage,
  },
  {
    name: "secure",
    path: "/secure",
    alias: "/protected",
    component: {
      template: `
        <div>
          This is a protected page-component
        </div>
      `
    },
    meta: {
      requireUserAuth: true
    }
  }
];

const router = new VueRouter({
  routes,
  mode: "history"
});

router.beforeEach(async (to, from, next) => {
  const isUserAuth = store.state.userAuth.isAuth;

  if (to.matched.some(record => record.meta.requireUserAuth)) {
    // this route requires user auth, check if logged in
    // if not, redirect to register/login page.
    if (!isUserAuth) {
      next({
        name: "login",
        query: { ...to.query, redirect: to.name }
      });
    } else {
      next();
    }
  } else {
    next(); // make sure to always call next()!
  }
});

export default router;
