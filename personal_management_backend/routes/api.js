const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const timetableController = require('../controllers/timetableController');
const modulesController = require('../controllers/modulesController');
const marksController = require('../controllers/marksController');
const moneyController = require('../controllers/moneyController');
const appointmentsController = require('../controllers/appointmentsController');
const journeysController = require('../controllers/journeysController');
const activitiesController = require('../controllers/activitiesController');

// Authentication routes
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/status', authController.checkAuth);

// Dashboard routes
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// Timetable routes
router.get('/timetable', timetableController.getTimetable);
router.post('/timetable', timetableController.addTimetable);
router.delete('/timetable/:id', timetableController.deleteTimetable);

// Modules routes
router.get('/modules', modulesController.getModules);
router.post('/modules', modulesController.addModule);
router.delete('/modules/:id', modulesController.deleteModule);

// Marks routes
router.get('/marks', marksController.getMarks);
router.post('/marks', marksController.addMarks);
router.delete('/marks/:id', marksController.deleteMarks);

// Money routes
router.get('/money', moneyController.getMoney);
router.post('/money', moneyController.addMoney);
router.put('/money/:id/return', moneyController.markMoneyReturned);
router.delete('/money/:id', moneyController.deleteMoney);

// Savings routes
router.get('/savings', moneyController.getSavings);
router.post('/savings', moneyController.addSavings);
router.delete('/savings/:id', moneyController.deleteSavings);

// Appointments routes
router.get('/appointments', appointmentsController.getAppointments);
router.post('/appointments', appointmentsController.addAppointment);
router.put('/appointments/:id/complete', appointmentsController.completeAppointment);
router.delete('/appointments/:id', appointmentsController.deleteAppointment);

// Journeys routes
router.get('/journeys', journeysController.getJourneys);
router.post('/journeys', journeysController.addJourney);
router.put('/journeys/:id/complete', journeysController.completeJourney);
router.delete('/journeys/:id', journeysController.deleteJourney);

// Activities routes
router.get('/activities', activitiesController.getActivities);

module.exports = router;
