/*

THIS IS COURTS INDEX

*/

const DAILY = 86400; //1 * 24 * 60 * 60 seconds
const express = require("express");
const router = express.Router();
const db = require("../../database/mysql");
const admin = require("../../firebase/notification");
const logger = require("../../logs/logger.js");
const courtsLogger = logger.courtsLogger;



// get all courts availability for all dates
router.get("/", (req, res) => {
	const sql = "SELECT * FROM courts";
  
	db.query(sql, (err, result) => {
		if (err) {
			throw err;
		}
		res.send(result);
	});
});

// get specific date
router.get("/:year/:month/:date", (req, res) => {
	var sql = "SELECT * FROM courts WHERE year = ? AND month = ? AND date = ?";
	db.query(sql, [req.params.year, req.params.month, req.params.date], (err, result) => {
		if (err) {
			throw err;
		}
		res.send(result);
	});
});

//Update an court availability 
router.put("/", (req, res) => {
    var body = req.body;
	const sql = "UPDATE courts SET time_slot1 = ?, time_slot2 = ?, time_slot3 = ?, time_slot4 = ? WHERE court_id = ?";
    db.query(sql, [body.time_slot1, body.time_slot2, body.time_slot3, body.time_slot4, body.court_id], (err, result) => {
        if (err) {
			throw err;
		}
        res.send(result);
    });
});


// set up court stats a week in advance 
function addCourtDate() {
	const sql = "INSERT IGNORE INTO courts (year, month, date, time_slot1, time_slot2, time_slot3, time_slot4) VALUES (?, ?, ?, 10, 10, 10, 10)";

	var date = new Date();
	date.setDate(date.getDate() + 7);

	const currentYear = date.getFullYear();
	const currentMonth = date.getMonth(); // month is 0 indexed
	const currentDate = date.getDate();

	db.query(sql, [currentYear, currentMonth+1, currentDate], (err, result) => {
		if (err) {
			throw err;
		}

		if (result.affectedRows === 0 && result.warningCount === 1) {
			courtsLogger.info("Court for " + date.toString() + " already exists");
		}
		else {
			courtsLogger.info("Inserted court for: " + date.toString());
		}
		
	});

}

setInterval(addCourtDate, DAILY*1000);


// delete court that"s 2 weeks old
function deleteCourt() {
	const sql = "DELETE FROM courts WHERE year = ? AND month = ? AND date = ?";

	var date = new Date();
	date.setDate(date.getDate() - 14);
	const currentYear = date.getFullYear();
	const currentMonth = date.getMonth(); // month is 0 indexed
	const currentDate = date.getDate();

	db.query(sql, [currentYear, currentMonth+1, currentDate], (err, result) => {
		if (err) {
			throw err;
		}
		if (result.affectedRows === 0) {
			courtsLogger.info("Court for: " + date.toString() + " does not exist");
		}
		else {
			courtsLogger.info("Deleted court for: " + date.toString());
		}
	});
}

setInterval(deleteCourt, DAILY*1000);

module.exports = router;