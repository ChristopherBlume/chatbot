/*
Author: Christopher Blume
Github: https://github.com/ChristopherBlume
*/

'use strict';

const functions = require('firebase-functions');
const {google} = require('googleapis');
const {WebhookClient} = require('dialogflow-fulfillment');

// Enter your calendar ID below and service account JSON below, see https://github.com/dialogflow/bike-shop/blob/master/README.md#calendar-setup
const calendarId = 'k0j9hmt1hlgpur9biknvomgngk@group.calendar.google.com'; // looks like "6ujc6j6rgfk02cp02vg6h38cs0@group.calendar.google.com"
const serviceAccount = {
  "type": "service_account",
  "project_id": "bikeshopsample-ldxnnm",
  "private_key_id": "6ddaafcbf4a718c52a1566cb7f783dc318e791de",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCln60bRNc5QFgk\n3VmxSMfQ+iYB/BrFoXw+2u2dYSQkR/agOEF2a3Oe/a0alrXoF/335bgfntzpWbn+\nVmx2YUe3s0Dfb3q0OVkR76jwlJCnSCq2Z1PyO1LVrDr81x8Ir0cxLo1tn9PYQf1+\nGHwAAKxIfTcHqB5DA0dQNbEdgwoBJSG8QTa1yfN8IpgM7hV7XeUZEUPAb9HIrE4G\nDnp6xpB+GbCEGUfm0Bi6cFYv3fBlkBmgzx9yQncxBG9M8vA+4unvYg5Ym8BYvkDD\ncqGiNgqRoVXSpoOPMPF0iaB7wo1JJ4ra0ru/WRkPBAvPSI82M6408OzsegmwTr6f\nw3iYTONNAgMBAAECggEAGRv1HYOOnDJiFUIC8rqq+HFZc8bptCPq9zMvqkLA553g\nCPhJDGVL7m2yYavkQMnqXzvSHJEewriErHIjwsAKzxHQ+E7UASC0nTXX8elEE5MA\nTrj+5A6/ByqI+C4Q7rshWuvI1eF7jMysXAKQQgaCwqv2Z3sYY2Z1gvaGNzLXlcac\nXmqQU9eCn1iQTPgcbxF06+1TsTq6lTNZzh8MjMtXaUMEvjaGYQaZTOtUXxkfObcv\nVZ86JM7HUurBRmBu0qQ1k6qp/CnvrrNrgwy+nzsChzkp+NT0MrCBQYS9ZpVe9Jvp\nG1/xsFnB+4+i2rop2Y97DK7/+Z8RsmNJzQTdvt6PTQKBgQDfwk0LTQxtuMw7krgk\nhA3wqycZpn8OZEfQHGZgbUX9zqsb8nK89VVOLxXj/arnf3kQtGReouaK8fP65uQu\nsXaKWLbM7XOdjJJTSNeyd2Nb4zBcTMSpuYA+wg0JQKTaCGhPVzwTcm5PgjO9+OyG\nCN8WdglXMApwsBQ3GgVcyLsbYwKBgQC9fPdAOdwCNO8MtcVB2UfmIvtByGyHlUNo\nkQa0dl8mRe+UruesAyfRKVDGw/Xxw+wvY18jiyIiq+WVh7CCJBeSmW/XD9y00kro\n6AI0Ci/vUlqUR+RH3Rwd7NQ9RjoY7NTU3U22gckaVa0bHMSudoOMSvuzF9E933AT\nCT4RRVY9jwKBgQCOCSeg0dLe31x9QGA1hcHXkL1sMd0bRJq1RyHReevg9cx2HAur\nWMxCqe7qX36aHre529iOnjdb4cRu8xvLbAkEPtYi9WPbkXzc8zNAbTqb/HYZUP3R\ngxgePk3KHsfGQ2n7WzOeYJgXTl4L7DQvzPfXqSu6tZsa9xqN862NvTnQYwKBgQC7\ngfHZqGfB90emuCjepHi1j2A7FG3xLQ9rZjfQVGKLqSEPbJTsbqL0I4I/bqLt/wa1\nTgxTS9cXoCqr8X4FCloZQ6ScmKG6fW6LUyr6/Cm7FS91FD8drfuo0Tak+9151MI3\nclb4hy3N1YJbFfi6+6PpLDouWx8/rt9ktvyocoiImQKBgQC46ne6RlpqlZWxAFnw\nJNuqH+e64ErDzJIppREOlBzZLdq76HH2CqeS8H5vtKdoaCVbeylfG9pxm/Lhrwq/\nIyKToUg39tmUUxwIXTJ/JTSgMXWoj+dSKce9TbCqgScV0AMPO9YkWjVHGxUqslTQ\n8BIAWmNoRg7KqlGWB/8hXPHFGQ==\n-----END PRIVATE KEY-----\n",
  "client_email": "bike-shop-calendar@bikeshopsample-ldxnnm.iam.gserviceaccount.com",
  "client_id": "115309098981921094093",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/bike-shop-calendar%40bikeshopsample-ldxnnm.iam.gserviceaccount.com"
}; // Starts with {"type": "service_account",...

// Set up Google Calendar Service account credentials
const serviceAccountAuth = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: 'https://www.googleapis.com/auth/calendar'
});

const calendar = google.calendar('v3');
process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements

const timeZone = 'Europe/Berlin';
const timezoneOffset = '+02:00';

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });

  function hours (agent) {
    if (currentlyOpen()) {
      agent.add(`We're open now! We close at 8pm today.`);
    } else {
      agent.add(`We're currently closed, but we open every weekday at 9am!`);
    }
  }

  function makeAppointment (agent) {
    // Calculate appointment start and end datetimes (end = +1hr from start)
    const dateTimeStart = new Date(Date.parse(agent.parameters.date.split('T')[0] + 'T' + agent.parameters.time.split('T')[1].split('+')[0] + timezoneOffset));
    const dateTimeEnd = new Date(new Date(dateTimeStart).setHours(dateTimeStart.getHours() + 1));
    const appointmentTimeString = dateTimeStart.toLocaleString(
      'en-US',
      { month: 'long', day: 'numeric', hour: 'numeric', timeZone: timeZone }
    );
    // Check the availibility of the time, and make an appointment if there is time on the calendar
    return createCalendarEvent(dateTimeStart, dateTimeEnd).then(() => {
      agent.add(`Ok, let me see if we can fit you in. ${appointmentTimeString} is fine!. For how many people do you need the table?`);
    }).catch(() => {
      agent.add(`I'm sorry, there are no tables available for ${appointmentTimeString}.`);
    });
  }
  
  function createCalendarEvent (dateTimeStart, dateTimeEnd) {
    const persons = new Number(agent.parameters.number);
    return new Promise((resolve, reject) => {
      calendar.events.list({
        auth: serviceAccountAuth, // List events for time period
        calendarId: calendarId,
        timeMin: dateTimeStart.toISOString(),
        timeMax: dateTimeEnd.toISOString()
      }, (err, calendarResponse) => { 
        // Check if there is a event already on the Bike Shop Calendar
        if (err || calendarResponse.data.items.length > 0) {
          reject(err || new Error('Requested time conflicts with another appointment'));
        } else {
          // Create event for the requested time period
          calendar.events.insert({ auth: serviceAccountAuth,
            calendarId: calendarId,
            resource: {summary: `Table Appointment for ${persons} persons.`,
              start: {dateTime: dateTimeStart},
              end: {dateTime: dateTimeEnd}}
          }, (err, event) => {
            err ? reject(err) : resolve(event);
          }
          );
        }
      });
    });
  }

  let intentMap = new Map();
  intentMap.set('Hours', hours);
  intentMap.set('Make Appointment', makeAppointment);
  agent.handleRequest(intentMap);
});

function currentlyOpen () {
  // Get current datetime with proper timezone
  let date = new Date();
  date.setHours(date.getHours() + parseInt(timezoneOffset.split(':')[0]));
  date.setMinutes(date.getMinutes() + parseInt(timezoneOffset.split(':')[0][0] + timezoneOffset.split(':')[1]));

  return date.getDay() >= 1 &&
        date.getDay() <= 6 &&
        date.getHours() >= 10 &&
        date.getHours() <= 23; 
}


