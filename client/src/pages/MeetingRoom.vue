<template>
  <div class="meeting-room w-full flex justifty-center items-center">
    <template v-if="!meetingSession && !error">
      <p class="mx-auto">Joining conversation...</p>
    </template>
    <template v-else-if="meetingSession && !error">
      <div class="flex flex-col py-10">
        <p>Chat room</p>
        <audio ref="audioElement"></audio>
        <ul class="space-y-6 mt-4">
          <li v-for="(value, key) in $data.roster" :key="key">
            <div class="w-20 h-20 bg-gray-400 rounded-full overflow-hidden">
              <p class="text-xs">{{ value.externalUserId }}</p>
            </div>
          </li>
        </ul>
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
  MeetingSessionConfiguration,
  DefaultActiveSpeakerPolicy
} from "amazon-chime-sdk-js";

export default {
  name: "MeetingRoom",
  data() {
    return {
      meetingSession: null,
      audioVideo: null, // type of AudioVideoFacade object
      joinInfo: null,
      error: null,
      enableWebAudio: true,
      roster: {},
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

      const handleAttendeeIdPresence = (attendeeId, present, externalUserId) => {
        if (!present) {
          const roster = { ...this.roster };
          delete roster[attendeeId];
          this.roster = roster;
          return;
        }
        if (!this.roster[attendeeId]) {
          const roster = { ...this.roster };
          roster[attendeeId] = {
            externalUserId,
          };
          this.roster = roster;
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
          // subscribe to realtime callbacks to track attendee presence changes,
          // and subscribe to callback to track active speaker
          this.audioVideo.realtimeSubscribeToAttendeeIdPresence(handleAttendeeIdPresence.bind(this));
          return this.audioVideo.start();
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
