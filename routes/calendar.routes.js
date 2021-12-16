const express = require('express');
const { getCalendarEvents, getUserConsent, createEvent } = require('../controllers/calendar.controllers');


const router = express.Router();


router.get('/userconsent', getUserConsent)
router.get('/events', getCalendarEvents)
  .post(createEvent)

module.exports = router