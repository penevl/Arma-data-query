const mongoose = require('mongoose')

const serverStateSchema = mongoose.Schema({
    serverName: String,
    map: String,
    missionName: String,
    zeus: String,
    date: String,
    playerCount: Number,
    players: Array
})

module.exports = mongoose.model('server-log', serverStateSchema)