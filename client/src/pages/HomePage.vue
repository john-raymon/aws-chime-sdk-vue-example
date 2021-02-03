<template>
  <div class="w-full">
    <div class="py-10 mx-auto">
      <h2>
        Spacegram (or maybe open-space) Prototype
      </h2>
      <p>Create a meeting room (you'll receive an invite link for others to join)</p>
      <router-link to="/join?create=true" class="block button text-center">
        Create a new room
      </router-link>
    </div>
  </div>
</template>
<script>
// import SvgExample from "@/assets/svgs/svg-example.svg";

export default {
  name: "HomePage"
};
</script>
<style lang="scss">
.homepage {
  max-height: 80vh;
}
</style>
