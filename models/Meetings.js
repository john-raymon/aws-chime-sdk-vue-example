const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    unique: true,
    index: true,
  },
  meetingSession: {
    type: Map,
    default: null,
  },
  hasMeetingEnded: {
    type: Boolean,
    default: false,
  }
})

MeetingSchema.plugin(uniqueValidator, { type: "mongoose-unique-validator" });

const Meeting = mongoose.model("Meeting", MeetingSchema);

module.exports = Meeting;
