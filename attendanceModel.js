const mongoose = require('mongoose')

const squadAttendanceSchema = mongoose.Schema({
    squad: String,
    missionName: String,
    date: String,
    playerCount: Number,
    squadCount: Number,
    attendance: Number,
    players: Array
})

module.exports = mongoose.model('squad-attendance', squadAttendanceSchema)