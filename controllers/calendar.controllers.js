const asyncHandler = require("../middleware/async")
const ErrorResponse = require("../utils/errorResponse")
const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.profile'];
const fs = require('fs');

const content = {
  "installed": {
    "client_id": "384632433368-tl2mr1rj9gu3c0oli2s7p0k2ir93h53r.apps.googleusercontent.com",
    "project_id": "learnfirebase1-16219",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "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",
    "redirect_uris": [
      "http://localhost:5000/api/calendar/events"
    ]
  }
}

const getClient = () => {
  return new Promise((resolve, reject) => {
    // Authorize a client with credentials, then call the Google Calendar API.
    const credentials = content
    const { client_secret, client_id, redirect_uris } = credentials.installed;


    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

    resolve(oAuth2Client)
  })

}

async function getAuthClient(email, code) {
  return new Promise(async (resolve, reject) => {
    const oAuth2Client = await getClient();

    fs.readFile(`${email}.json`, (err, token) => {
      if (err) return getAccessToken();
      oAuth2Client.setCredentials(JSON.parse(token));
      resolve(oAuth2Client)
    });

    function getAccessToken() {
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error('Error retrieving access token', err);
          return new ErrorResponse(`Error retrieving access token `)
        }
        oAuth2Client.setCredentials(token);
        const TOKEN_PATH = `${email}.json`
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        resolve(oAuth2Client)
      });
    }
  })
}

exports.getUserConsent = asyncHandler(async (req, res, next) => {
  const email = req.query.email

  const oAuth2Client = await getClient();

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  res.writeHead(301,
    { Location: `${authUrl}&email=${email}` }
  );
  res.end();
})

exports.getCalendarEvents = asyncHandler(async (req, response, next) => {
  const code = req.query.code
  const email = req.query.email

  const auth = await getAuthClient(email, code)

  const calendar = google.calendar({ version: 'v3', auth: auth });
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    response.status(200).json(events)
  });
})

exports.createEvent = asyncHandler(async (req, res, next) => {
  const { event, emailIds } = req.body

  emailIds.forEach(async (email) => {
    const auth = await getAuthClient(email)
    calendar.events.insert({
      auth: auth,
      calendarId: 'primary',
      resource: event,
    }, function (err, event) {
      if (err) {
        new ErrorResponse('There was an error contacting the Calendar service: ' + err)
        return;
      }
      res.status(200).json({ message: 'Event created: %s' + event.htmlLink })
    });
  })
})