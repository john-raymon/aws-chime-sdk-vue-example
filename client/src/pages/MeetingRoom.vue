<template>
  <div class="meeting-room w-full flex justifty-center items-center">
    <template v-if="!meetingSession && !error">
      <p class="mx-auto">Joining a meeting...</p>
    </template>
    <template v-else-if="meetingSession && !error">
      <div class="flex flex-col py-10">
        <p>Meeting room</p>
        <audio ref="audioElement"></audio>
        <div class="flex flex-col w-1/2">
          <video class="block" ref="defaultVideoElement"></video>
          <video class="block" ref="attendeeVideoElement"></video>
        </div>
      </div>
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
    console.log("created() called");
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
          // update join?create=true path
          // to a sharable meeting path with a unique meetingTitle param
          // now that we have a meeting created,
          // ex. /join?create=true -> http://localhost:8080/join/meeting-f8fd96ed-2777-4605-b441-800a6a549800
          if (!this.$route.params.meetingTitle) {
            history.pushState(
              {},
              null,
              this.$route.path + "/" + encodeURIComponent(this.joinInfo.meeting.ExternalMeetingId)
            );
          }
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
        videoTileDidUpdate: tileState => {
          console.log({ tileState });
          const audioElement = this.$refs.audioElement;
          const isDefaultVideo = tileState.tileId === 1;
          // bind audio output to audio HTML DOM element using ref
          this.audioVideo.bindAudioElement(audioElement);
          this.audioVideo.bindVideoElement(
            tileState.tileId,
            isDefaultVideo ? this.$refs.defaultVideoElement : this.$refs.attendeeVideoElement
          );
        },
        audioVideoDidStart: () => {
          console.log("Started");
        },
        audioVideoDidStop: sessionStatus => {
          console.log("Stopped with a session status code: ", sessionStatus.statusCode());
        },
        audioVideoDidStartConnecting: reconnecting => {
          if (reconnecting) {
            console.log("Attempting to reconnect");
          }
        }
      };
      // set up audio input and out put devices, and bind to DOM audio element
      this.audioVideo
        .listAudioInputDevices()
        .then(audioInputDevices => {
          return this.audioVideo.chooseAudioInputDevice(audioInputDevices[0].deviceId);
        })
        .then(() => {
          return this.audioVideo.listAudioOutputDevices();
        })
        .then(audioOutputDevices => {
          // note: on firefox browsers there audioOutputDevices returns as empty
          // https://github.com/aws/amazon-chime-sdk-js/issues/657#issuecomment-687363939
          return this.audioVideo.chooseAudioOutputDevice(
            audioOutputDevices.length ? audioOutputDevices[0].deviceId : null
          );
        })
        .then(() => {
          const audioElement = this.$refs.audioElement;
          // bind audio output to audio HTML DOM element using ref
          return this.audioVideo.bindAudioElement(audioElement);
        })
        .then(() => {
          // register audio-video lifecycle observer
          this.audioVideo.addObserver(observer);

          return this.audioVideo.start();
        })
        .then(() => {
          this.audioVideo
            .listVideoInputDevices()
            .then(videoInputDevices => {
              return this.audioVideo.chooseVideoInputDevice(
                videoInputDevices.length ? videoInputDevices[0].deviceId : null
              );
            })
            .then(() => {
              return this.audioVideo.startLocalVideoTile();
            });
        })
        .then(() => {
          // Unmute
          const unmuted = this.audioVideo.realtimeUnmuteLocalAudio();

          if (unmuted) {
            console.log("Other attendees can hear your audio");
          } else {
            // See the realtimeSetCanUnmuteLocalAudio use case below.
            console.log("You cannot unmute yourself");
          }
          const muted = this.audioVideo.realtimeIsLocalAudioMuted();
          if (muted) {
            console.log("You are muted");
          } else {
            console.log("Other attendees can hear your audio");
          }
        })
        .catch(err => {
          console.log("error", err);
          this.error = {
            ...err,
            message: "There was an error setting up your audio inputs"
          };
        });
    }
  }
};
</script>
