<template>
  <div class="meeting-room w-full flex justifty-center items-center">
    <template v-if="!meetingSession && !error">
      <p class="mx-auto">Joining a meeting...</p>
    </template>
    <template v-else-if="meetingSession && !error">
      <p>Meeting room</p>
      <audio ref="audioElement"></audio>
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
      this.setUpDevicesAndStart();
    },
    setUpDevicesAndStart() {
      // observe audio-video lifecycle
      const observer = {
        audioVideoDidStart: () => {
          console.log("Started");
        },
        audioVideoDidStop: (sessionStatus) => {
          console.log("Stopped with a session status code: ", sessionStatus.statusCode());
        },
        audioVideoDidStartConnecting: (reconnecting) => {
          if (reconnecting) {
            console.log("Attempting to reconnect");
          }
        },
      };
      // set up audio input and out put devices, and bind to DOM audio element
      this.audioVideo.listAudioInputDevices()
        .then(audioInputDevices => {
          debugger;
          this.audioVideo.chooseAudioInputDevice(audioInputDevices[0].deviceId);
          return this.audioVideo.listAudioOutputDevices();
        })
        .then(audioOutputDevices => {
          debugger;
          // note: on firefox browsers there audioOutputDevices returns as empty
          // https://github.com/aws/amazon-chime-sdk-js/issues/657#issuecomment-687363939
          return this.audioVideo.chooseAudioOutputDevice(audioOutputDevices.length ? audioOutputDevices[0].deviceId : null);
        })
        .then(() => {
          const audioElement = this.$refs;
          debugger;
          // bind audio output to audio HTML DOM element using ref
          this.audioVideo.bindAudioElement(audioElement);
          debugger;
          // register audio-video lifecycle observer
          this.audioVideo.addObserver(observer);
          debugger;
          this.audioVideo.start();
        })
        .catch((err) => {
          debugger;
          console.log('error', err);
          this.error = {
            ...err,
            message: 'There was an error setting up your audio inputs',
          }
        })
    },
  }
};
</script>
