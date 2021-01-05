<template>
  <div class="meeting-room w-full flex justifty-center items-center">
    <template v-if="!meetingSession && !error">
      <p class="mx-auto">Joining a meeting...</p>
    </template>
    <template v-else-if="meetingSession && !error">

    </template>
    <template v-else-if="error">
      <p class="mx-auto text-red-500">Oops, there was an error connecting you to this room.</p>
    </template>
  </div>
</template>
<script>
export default {
  name: "MeetingRoom",
  data() {
    return {
      meetingSession: null,
      error: null,
    }
  },
  created() {
    // redirect to home if "create" or "meetingTitle" id is missing
    if (!this.$route.query.create && !this.$route.params.meetingTitle) {
      this.$router.push('/');
    } else {
      this.fetchOrCreateMeetingAndAttendee();
    }
  },
  methods: {
    fetchOrCreateMeetingAndAttendee() {
      const path = this.$route.query.create ? '/join' : `/join/${this.$route.params.meetingTitle}`;
      this.$http
        ._post(path, null, true)
        .then(res => {
          debugger;
          console.log({ res });
        })
        .catch((err) => {
          console.log({ err })
        })
    },
    // initMeetingSession() {

    // },
  },
}
</script>
