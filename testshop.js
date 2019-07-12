/*
Author: Christopher Blume
Github: https://github.com/ChristopherBlume
*/

'use strict';
// imports of firebase functions, googleapi and dialogflow-fulfillmet
const functions = require('firebase-functions');
const {google} = require('googleapis');
const {WebhookClient} = require('dialogflow-fulfillment');

// Google calendar ID and service account JSON ; deleted due to github repo
const calendarId;
const serviceAccount = {

}; 

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
      agent.add(`We're open now! We close at 11pm today.`);
    } else {
      agent.add(`We're currently closed, but we open every weekday at 10am!`);
    }
  }

  function makeAppointment (agent) {
    // Calculate appointment start and end datetimes (end = +1hr from start) converting dialogflow date and time entity. Pull number of persons and client name.
    const dateTimeStart = new Date(Date.parse(agent.parameters.date.split('T')[0] + 'T' + agent.parameters.time.split('T')[1].split('+')[0] + timezoneOffset));
    const dateTimeEnd = new Date(new Date(dateTimeStart).setHours(dateTimeStart.getHours() + 1));
    const persons = Number(agent.parameters.number);
    const name = String(agent.parameters.namelist)
    const appointmentTimeString = dateTimeStart.toLocaleString(
      'en-US',
      { month: 'long', day: 'numeric', hour: 'numeric', timeZone: timeZone }
    );
    // Check the availibility of the time, and make an appointment if there is time on the calendar
    return createCalendarEvent(dateTimeStart, dateTimeEnd, persons, name).then(() => {
      agent.add(`Ok, let me see if we can fit you in. ${appointmentTimeString} is fine! We book your table for ${persons} persons.`);
    }).catch(() => {
      agent.add(`I'm sorry, there are no tables available for ${appointmentTimeString}.`);
    });
  }
  
  function createCalendarEvent (dateTimeStart, dateTimeEnd, persons, name) {
    return new Promise((resolve, reject) => {
      calendar.events.list({
        auth: serviceAccountAuth, // List events for time period
        calendarId: calendarId,
        timeMin: dateTimeStart.toISOString(),
        timeMax: dateTimeEnd.toISOString()
      }, (err, calendarResponse) => { 
        // Check if there is a event already on the Google Calendar
        if (err || calendarResponse.data.items.length > 0) {
          reject(err || new Error('Requested time conflicts with another appointment'));
        } else {
          // Create event for the requested time period
          calendar.events.insert({ auth: serviceAccountAuth,
            calendarId: calendarId,
            resource: {summary: `Table Booking for ${persons} persons`,
              start: {dateTime: dateTimeStart},
              end: {dateTime: dateTimeEnd},
              description: `Mrs./Mr. ${name} has reserved a table for ${persons} persons.`
            }
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


