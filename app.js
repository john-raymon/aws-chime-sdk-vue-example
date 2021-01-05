require("dotenv").config();
require('module-alias/register');
const config = require('config');
const mongodbUri = config.get('app.mongodbUri');
const isProduction = process.env.NODE_ENV !== 'development';
const mongoose = require('mongoose');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const history = require('connect-history-api-fallback');
const AWS = require('aws-sdk');
const app = express();
const { v4: uuid } = require('uuid');

/**
 * util function to check for missing body fields
 */
const isBodyMissingProps = require('@/utils/isBodyMissingProps');

// import Meetings mongoose model
const Meetings = require("@/models/Meetings");

// set up AWS SDK with
AWS.config.credentials = new AWS.Credentials(process.env.AWSAccessKeyId, process.env.AWSSecretKey);
// the AWS Chime SDK documentation states the instance of the AWS.Chime object
// currently must be configured to us-east-1, however the actual region where the
// meetings are hosted can be configured when invoking Chime.createMeeting
const chime = new AWS.Chime({ region: 'us-east-1' });
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');


// Set up Mongodb
if (isProduction) {
  mongoose.connect(mongodbUri);
} else {
  mongoose
    .connect(mongodbUri, { useUnifiedTopology: true, useNewUrlParser: true })
    .catch((error) => {
      console.log("Mongodb crashed ERROR:", error);
    });
  mongoose.set("debug", true);
}

const sixtyDaysInSeconds = 5184000
app.use(helmet.hsts({
  maxAge: sixtyDaysInSeconds
}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(history());
app.use(express.static('./client/dist'));



app.param('meetingTitle', (req, res, next, meetingTitle) => {
  /**
   * try to locate an existing meeting by a unique title
   * (ideally in a prod. env. maybe meetings that have ended can
   * be removed from the db collection after a couple hours so that the unique meeting title can be recycled)
   */
  return Meetings.findOne({
    title: meetingTitle,
  })
  .exec()
  .then((meeting) => {
    if (!meeting) {
      return next({
        name: "NotFound",
        message: "We could not locate this meeting."
      })
    }
    if (meeting.hasMeetingEnded) {
      return next({
        name: "BadRequest",
        message: "The meeting has ended.",
      })
    }
    req.meeting = meeting;
    return next();
  }).catch(next);
});

// utilize chime:createMeeting and chime:createAttendee
// aws-sdk methods to serve appr
app.post('/join/:meetingTitle?', (req, res, next) => {
  const createNewAttendee = (meetingDocument) => {
    const meeting = meetingDocument.meetingSession.get('Meeting');
    const uniqueAttendeeId = `attendee-${uuid()}`;
    /**
     * note, there may be a 404, meeting not found
     * if no attendees join within 5 minutes
     * The moment CreateMeeting or CreateMeetingWithAttendees is invoked
     * and the meeting is created, the auto end policies
     * will kick in and if no one joins the meeting,
     * it will close within 5 minutes.
     * https://github.com/aws/amazon-chime-sdk-js/issues/400#issuecomment-637264882
     */
    return chime.createAttendee({
      MeetingId: meeting.MeetingId,
      ExternalUserId: uniqueAttendeeId
    }).promise().catch((err) => {
      if (err.code === "NotFound") {
        throw {
          name: "BadRequest",
          message: "The meeting session has expired as no attendees joined within 5 minutes",
        };
      }
      throw err;
    })
  }

  const returnMeetingAndAttendeeResponse = (meeting, attendee) => {
    return res.json({
      success: true,
      joinInfo: {
        meeting,
        attendee: attendee.Attendee
      }
    });
  };

  /**
   * if the meeting title param is undefined we assume
   * the user is attempting to create a new "meeting" room,
   * so we generate a new meeting,
   * with a unique meeting title for them
   * and return it to the client,
   * allowing the user to share a "join meeting link" with attendees that
   * can be sent in subsequent request
   */
  if (!req.params.meetingTitle) {
   const uniqueMeetingTitle = `meeting-${uuid()}`;
   return chime.createMeeting({
    ClientRequestToken: uuid(),
    ExternalMeetingId: uniqueMeetingTitle,
   })
   .promise()
   .then((chimeMeeting) => {
    const meeting = new Meetings({
      title: uniqueMeetingTitle,
      meetingSession: chimeMeeting,
    });
    return meeting.save();
   })
   .then((meeting) => {
     // create new attendee for meeting
     return createNewAttendee(meeting)
      .then((attendee) => {
        return returnMeetingAndAttendeeResponse(meeting.meetingSession.get('Meeting'), attendee);
      })
   })
   .catch(next);
  }

  // fetch existing meeting info
  const meeting = req.meeting;
  // create new attendee for meeting
  return createNewAttendee(meeting)
    .then((attendee) => {
      return returnMeetingAndAttendeeResponse(meeting.meetingSession.get('Meeting'), attendee);
    })
    .catch(next);
})


// API endpoints
app.use('/api', require('./routes/api'));

app.get("/*", function(req, res) {
  return res.sendFile("./client/public/index.html");
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  // render the error page
  res.status(err.status || 500).json(err);
});

module.exports = app;
