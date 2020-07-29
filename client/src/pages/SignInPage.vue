<template>
  <div class="mt-32 w-full flex items-center flex-col">
    <!-- TODO: add to this component ability to toggle into merchant sign in -->
    <div class="container max-w-md mx-auto flex flex-col items-center justify-center px-2">
      <div class="bg-white px-6 py-6 rounded shadow-md text-black w-full">
        <h1 class="tracking-wide pb-6 text-center text-gray-800">Sign in as a user</h1>
        <input
          type="text"
          class="text-field"
          name="email"
          placeholder="Email"
          v-model="email"
        />

        <input
          type="password"
          class="text-field"
          name="password"
          placeholder="Password"
          v-model="password"
        />

        <button
          type="submit"
          class="button w-full"
          @click="onSubmit"
        >
          Sign In
        </button>

      </div>

      <div class="text-gray-dark mt-6 tracking-wider text-sm">
        Don't have an account?
        <router-link class="no-underline border-b border-blue-500 text-blue-500" to="/sign-up">
          Sign up here
        </router-link>
      </div>
    </div>
  </div>
</template>
<script>
import { mapActions } from "vuex";

export default {
  name: "SignInPage",
  props: ['userAuth'],
  data() {
    return {
      email: "",
      password: ""
    };
  },
  watch: {
    userAuth: {
      handler(val) {
        if (val.isAuth) {
          const redirectRouteName = this.$route.query.redirect || "home";
          return this.$router.push({ name: redirectRouteName, query: this.$route.query });
        }
      },
      immediate: true,
    }
  },
  methods: {
    ...mapActions(["updateUserAuth"]),
    onSubmit() {
      this.$http
        ._post("/users/login", { email: this.email, password: this.password })
        .then(body => {
          return this.updateUserAuth({
            isAuth: true,
            user: body.user
          });
        })
        .catch(err => {
          if (err.response) {
            console.log("Error when attempting to login user", err, err.response);
            return alert(JSON.stringify(err.response.data));
          }
        });
    }
  }
};
</script>
