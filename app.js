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
  debugger;
  return Meetings.findOne({
    title: meetingTitle,
  })
  .exec()
  .then((meeting) => {
    if (meeting) {
      req.meeting = meeting;
    }
    return next();
  }).catch(next);
});

// utilize chime:createMeeting and chime:createAttendee
// aws-sdk methods to serve appr
app.post('/join/:meetingTitle?', (req, res, next) => {
  const requiredProps = [
    ['attendeeName', 'Your name is required.'],
  ];

  const { hasMissingProps, propErrors } = isBodyMissingProps(
    requiredProps,
    req.body
  );

  if (hasMissingProps) {
    return next({
      name: "ValidationError",
      errors: propErrors
    });
  }

  /**
   * if the meeting title param is undefined we assume
   * the user is create a new "meeting" room, so we generate the
   * unique meeting title for them and return it to the client,
   * allowing the user to share a "join meeting link" with attendees that
   * can be sent in subsequent request
   */
  if (!req.params.meetingTitle) {
   const uniqueMeetingTitle = `meeting-${uuid()}`;
   debugger;
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
     // set-up attendee info
     res.json({
      success: true,
      meeting,
     })
   })
   .catch(next);
  }

  return res.json({
    success: true,
    meeting: false,
  })
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
  debugger;
  // render the error page
  res.status(err.status || 500).json(err);
});

module.exports = app;
