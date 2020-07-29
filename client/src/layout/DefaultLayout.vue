<template>
  <div class="default-layout">
    <nav>
      <ul>
        <template v-if="userAuth.isAuth">
          <li>
            <router-link to="/secure">
              Secure page
            </router-link>
          </li>
          <li>
            <a href="" @click.prevent="$emit('log-out')">
              Sign out
            </a>
          </li>
        </template>
        <template v-else>
          <li>
            <router-link to="/sign-up">
              Sign up
            </router-link>
          </li>
          <li>
            <router-link to="/sign-in">
              Sign in
            </router-link>
          </li>
        </template>
      </ul>
    </nav>
    <main class="main">
      <slot />
    </main>
    <footer class="w-full flex justify-center text-gray-800 text-xs tracking-widest py-10">
      <a href="https://github.com/john-raymon" target="_blank">
        Made with 💓love by https://github.com/john-raymon
      </a>
    </footer>
  </div>
</template>

<script>

export default {
  name: "DefaultLayout",
  props: ['userAuth'],
};
</script>
<style lang="scss">
html,
body {
  @apply bg-gray-100;
}
.default-layout {
  @apply h-full max-w-screen-lg mx-auto px-2 bg-gray-100;
  .main {
    @apply flex;
    min-height: calc(100vh - 6.25rem); // 6.25rem is the height of the footer in this layout
  }
}
</style>
