import VueRouter from "vue-router";
import HomePage from "@/pages/HomePage";
import MeetingRoom from "@/pages/MeetingRoom";
import store from "@/vuex";

const routes = [
  {
    name: "home",
    path: "",
    component: HomePage
  },
  {
    name: "meeting-room",
    path: "/join/:meetingTitle?",
    alias: "/join/:meetingTitle",
    component: MeetingRoom
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
