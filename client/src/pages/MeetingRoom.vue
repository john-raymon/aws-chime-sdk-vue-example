<template>
  <div class="meeting-room w-full flex justifty-center items-center">
    <template v-if="!meetingSession && !error">
      <p class="mx-auto">Joining a meeting...</p>
    </template>
    <template v-else-if="meetingSession && !error">
      <p>Meeting room</p>
    </template>
    <template v-else-if="error">
      <p class="mx-auto text-red-500">Oops, there was an error connecting you to this room.</p>
    </template>
  </div>
</template>
<script>
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration
} from "amazon-chime-sdk-js";

export default {
  name: "MeetingRoom",
  data() {
    return {
      meetingSession: null,
      audioVideo: null, // type of AudioVideoFacade object
      joinInfo: null,
      error: null,
      enableWebAudio: true
    };
  },
  created() {
    // redirect to home if "create" or "meetingTitle" id is missing
    if (!this.$route.query.create && !this.$route.params.meetingTitle) {
      this.$router.push("/");
    } else {
      this.fetchOrCreateMeetingAndAttendee();
    }
  },
  methods: {
    fetchOrCreateMeetingAndAttendee() {
      const path = this.$route.query.create ? "/join" : `/join/${this.$route.params.meetingTitle}`;
      this.$http
        ._post(path, null, true)
        .then(res => {
          this.joinInfo = res.joinInfo;
          this.initMeetingSession(this.joinInfo);
          console.log({ joinInfo: res.joinInfo });
        })
        .catch(err => {
          this.error = err;
        });
    },
    initMeetingSession(joinInfo) {
      // initialize meeting session configuration object with results
      // from CreateMeeting and CreateAttendee API calls
      const meetingSessionConfiguration = new MeetingSessionConfiguration(
        joinInfo.meeting,
        joinInfo.attendee
      );
      const logger = new ConsoleLogger("SDK", LogLevel.DEBUG);
      const deviceController = new DefaultDeviceController(logger);
      meetingSessionConfiguration.enableWebAudio = this.enableWebAudio;
      this.meetingSession = new DefaultMeetingSession(
        meetingSessionConfiguration,
        logger,
        deviceController
      );
      this.audioVideo = this.meetingSession.audioVideo;
    }
  }
};
</script>
