require('dotenv').config()
const Gamedig = require('gamedig');
const mongoose = require('mongoose')
const fs = require('fs')
const ServerState = require('./models/stateModel')
const nodeCron = require('node-cron')
const logger = require('skinwalker')
const express = require('express');
const AttendanceModel = require('./models/attendanceModel')
const app = express()

logger.init(process.env.LOG_LEVEL, {
    traceWriteFile: true
})

app.set('view engine', 'ejs');
logger.info('Set view engine to ejs', 'webserver')

app.use('/', express.static('./charts'))   
app.use('/assets', express.static('./assets'))
logger.info('Served static files', 'webserver')

connectToDB().catch(err => {
    logger.error(err.message, 'database')
})

async function connectToDB() {
    logger.trace('Attempting connection to database at: ' + process.env.MONGO_CONNECTION, 'database')
    await mongoose.connect(process.env.MONGO_CONNECTION)
    logger.trace('Established connection to database at: ' + process.env.MONGO_CONNECTION, 'database')
    logger.info('Connected to database', 'database')
}

logger.info('Setting up cron job with schedule: ' + process.env.CRON_SCHEDULE, 'query')
nodeCron.schedule(process.env.CRON_SCHEDULE,() => {
    queryServer()   
},{
    scheduled: true,
    timezone: process.env.CRON_TIMEZONE
})

function queryServer() {
    
    Gamedig.query({
        type: 'arma3',
        host: process.env.SERVER_IP.toString()
    }).then((state) => {
        logger.info('Querying server at: ' + process.env.SERVER_IP, 'gamedig')
        dataReady(state)
    }).catch((error) => {
        logger.error(error.message, 'gamedig')
    });

}

function dataReady(data) {
    
    logger.info('Server queried successfully', 'gamedig')
    logger.trace('Raw server data: ' + JSON.stringify(data), 'gamedig')

    logger.info('Formating raw server data', 'query')
    var dataSet = {
        serverName: String,
        map: String,
        missionName: String,
        zeus: String,
        date: String,
        playerCount: Number,
        players: Array
    }

    dataSet.serverName = data.name
    dataSet.map = data.map
    dataSet.missionName = data.raw.game
    dataSet.date = new Date().toISOString()
    dataSet.playerCount = data.raw.numplayers
    var online = []
    data.players.forEach(x => {
        online.push(x.name)
    });
    dataSet.players = online
    var cutUp = data.raw.game.toString().split('_')
    dataSet.zeus = cutUp[1]
    logger.info('Raw server data formated', 'query')
    logger.trace('Formated data: ' + JSON.stringify(dataSet), 'query')

    logger.trace('Log function called', 'query')
    logServerState(dataSet)

}

async function logServerState(serverData) {
    
    var date = new Date().toISOString()
    logger.trace('Log date: ' + date, 'query')

    logger.info('Loggin server state to local file', 'query')
    fs.writeFile('./server-logs/' + date + '.json',JSON.stringify(serverData), err => {
        if(err != null){
            logger.error(err.message, 'query')
        }
    })

    const serverState = new ServerState(serverData)

    logger.info('Logging server state to MongoDB' , 'query')
    await serverState.save()
    logger.info('Saved server state to DB', 'query')

    logEchoAttendance()
    logFoxtrotAttendance()

}

async function logEchoAttendance() {

    logger.info('Trying to log echo attendance to DB', 'webserver/echo')
    const dbState = await ServerState.find()
    logger.trace('dbState: ' + dbState, 'webserver/echo')
    const serverLog = dbState[dbState.length - 1]
    logger.trace('serverLog: ' + JSON.stringify(serverLog), 'webserver/echo')
    const echotSquad = process.env.ECHO.toString().split(',')
    logger.trace('echoSquad: ' + echotSquad, 'webserver/echo')
    const strippedPlayers = serverLog.players.toString().replaceAll(/\s*\[.*?]/g, '')
    logger.trace('strippedPlayers: ' + strippedPlayers, 'webserver/echo')

    var temp = {
        squad: String,
        missionName: String,
        date: String,
        playerCount: Number,
        squadCount: Number,
        attendance: Number,
        players: Array
    }

    var tempPlayers = []
    temp.missionName = serverLog.missionName
    temp.date = serverLog.date.split('T')[0]
    temp.playerCount = serverLog.playerCount
    echotSquad.forEach(member => {
        if (strippedPlayers.toString().includes(member)) {
            tempPlayers.push(member)
        }
    })
    temp.players = tempPlayers
    temp.squadCount = tempPlayers.length
    temp.attendance = ((temp.squadCount / echotSquad.length) * 100)
    temp.squad = 'echo'
    logger.trace('temp: ' + temp, 'webserver/echo')
    
    const attendanceModel = new AttendanceModel(temp)
    logger.info('Logging echo attendance to DB', 'webserver/echo')
    await attendanceModel.save()
    logger.info('Loged echo attendance to DB', 'webserver/echo')

}

async function logFoxtrotAttendance() {

    logger.info('Trying to log foxtrot attendance to DB', 'webserver/foxtrot')
    const dbState = await ServerState.find()
    logger.trace('dbState: ' + dbState, 'webserver/foxtrot')
    const serverLog = dbState[dbState.length - 1]
    logger.trace('serverLog: ' + JSON.stringify(serverLog), 'webserver/foxtrot')
    const foxtrotSquad = process.env.FOXTROT.toString().split(',')
    logger.trace('foxtrotSquad' + foxtrotSquad, 'webserver/foxtrot')
    const strippedPlayers = serverLog.players.toString().replaceAll(/\s*\[.*?]/g, '')
    logger.trace('strippedPlayers: ' + strippedPlayers, 'webserver/foxtrot')

    var temp = {
        squad: String,
        missionName: String,
        date: String,
        playerCount: Number,
        squadCount: Number,
        attendance: Number,
        players: Array
    }

    var tempPlayers = []
    temp.missionName = serverLog.missionName
    temp.date = serverLog.date.split('T')[0]
    temp.playerCount = serverLog.playerCount
    foxtrotSquad.forEach(member => {
        if (strippedPlayers.toString().includes(member)) {
            tempPlayers.push(member)
        }
    })
    temp.players = tempPlayers
    temp.squadCount = tempPlayers.length
    temp.attendance = ((temp.squadCount / foxtrotSquad.length) * 100)
    temp.squad = 'foxtrot'
    logger.trace('temp: ' + temp, 'webserver/foxtrot')
    
    const attendanceModel = new AttendanceModel(temp)
    logger.info('Logging foxtrot attendance to DB', 'webserver/foxtrot')
    await attendanceModel.save()
    logger.info('Loged foxtrot attendance to DB', 'webserver/foxtrot')

}

app.get('/', async (req, res) => {

    const dbState = await ServerState.find()
    logger.trace('dbState: ' + dbState, 'webserver')

    var serverLogs = []

    dbState.forEach( serverLog => {

        var temp = {
            missionName: String,
            date: String,
            playerCount: Number,
            players: Array
        }

        temp.missionName = serverLog.missionName
        temp.date = serverLog.date.split('T')[0]
        temp.playerCount = serverLog.playerCount
        temp.players = serverLog.players.toString().replaceAll(/\s*\[.*?]/g, '')
        serverLogs.unshift(temp)
    })

    var chartData = []

    dbState.forEach(element => {
        
        var temp = {
            playerCount: Number,
            date: String
        }

        temp.date = element.date.split('T')[0]
        temp.playerCount = element.playerCount

        chartData.unshift(temp)

    })

    logger.trace('serverLogs: ' + JSON.stringify(serverLogs), 'webserver')
    logger.trace('chartData: ' + JSON.stringify(chartData), 'webserver')
    res.render('index', {
        serverLogs: serverLogs,
        chartData: JSON.stringify(chartData)
    })

})

app.get('/echo', async (req, res) => {

    const dbState = await AttendanceModel.find({squad: 'echo'})
    logger.trace('dbState: ' + dbState, 'webserver/echo')
    const echotSquad = process.env.ECHO.toString().split(',')
    logger.trace('echoSquad: ' + echotSquad, 'webserver/echo')

    var serverLogs = []

    dbState.slice().reverse().forEach( serverLog => {
        
        var strippedPlayers = serverLog.players.toString().replaceAll(/\s*\[.*?]/g, '')

        var temp = {
            missionName: String,
            date: String,
            playerCount: Number,
            squadCount: Number,
            attendance: Number,
            players: Array
        }

        var tempPlayers = []
        temp.missionName = serverLog.missionName
        temp.date = serverLog.date.split('T')[0]
        temp.playerCount = serverLog.playerCount
        echotSquad.forEach(member => {
            if (strippedPlayers.toString().includes(member)) {
                tempPlayers.push(member)
            }
        })
        temp.players = tempPlayers
        temp.squadCount = tempPlayers.length
        temp.attendance = ((temp.squadCount / echotSquad.length) * 100).toFixed(2)
        serverLogs.unshift(temp)
    })
    logger.trace('serverLogs: ' + JSON.stringify(serverLogs), 'webserver/echo')

    var chartData = []

    serverLogs.forEach(element => {
        
        var temp = {
            attendancePercentage: Number,
            date: String
        }

        temp.date = element.date.split('T')[0]
        temp.attendancePercentage = ((element.squadCount / process.env.ECHO.toString().split(',').length) * 100)

        chartData.unshift(temp)

    })
    logger.trace('chartData: ' + JSON.stringify(chartData), 'webserver/echo')

    var individualAttendance = []

    echotSquad.forEach(player => {
        var temp = {
            playerName: String,
            attendance: Number
        }
        temp.playerName = player
        
        logger.trace('Calculating attendance for player ' + player, 'webserver/echo')
        var attended = 0

        dbState.forEach(element => {
            logger.trace('Checking attendance for ' + player + ' in operation ' + element.missionName, 'webserver/echo')
            if(element.players.toString().replaceAll(/\s*\[.*?]/g, '').includes(player)){
                logger.trace('Bumping attendance counter for player ' + player, 'webserver/echo')
                attended++
            }
        })

        logger.trace('Attended OPs for player ' + player + ' calculated to ' + attended, 'webserver/echo')
        var att = ((attended / dbState.length) * 100).toFixed(2)
        logger.trace('Attendedance for player ' + player + ' calculated to ' + att + '%', 'webserver/echo')
        temp.attendance = att
        individualAttendance.unshift(temp)
    })
    logger.trace('individualAttendance: ' + JSON.stringify(individualAttendance), 'webserver/echo')

    res.render('echo', {
        serverLogs: serverLogs,
        individualAttendance: individualAttendance,
        chartData: JSON.stringify(chartData)
    })
        
})

app.get('/foxtrot', async (req, res) => {

    const dbState = await AttendanceModel.find({squad: 'foxtrot'})
    logger.trace('dbState: ' + dbState, 'webserver/foxtrot')
    const foxtrotSquad = process.env.FOXTROT.toString().split(',')
    logger.trace('foxtrotSquad: ' + foxtrotSquad, 'webserver/foxtrot')

    var serverLogs = []

    dbState.slice().reverse().forEach( serverLog => {
        
        var strippedPlayers = serverLog.players.toString().replaceAll(/\s*\[.*?]/g, '')

        var temp = {
            missionName: String,
            date: String,
            playerCount: Number,
            squadCount: Number,
            attendance: Number,
            players: Array
        }

        var tempPlayers = []
        temp.missionName = serverLog.missionName
        temp.date = serverLog.date.split('T')[0]
        temp.playerCount = serverLog.playerCount
        foxtrotSquad.forEach(member => {
            if (strippedPlayers.toString().includes(member)) {
                tempPlayers.push(member)
            }
        })
        temp.players = tempPlayers
        temp.squadCount = tempPlayers.length
        temp.attendance = ((temp.squadCount / foxtrotSquad.length) * 100).toFixed(2)
        serverLogs.unshift(temp)
    })
    logger.trace('serverLogs: ' + JSON.stringify(serverLogs), 'webserver/foxtrot')

    var chartData = []

    serverLogs.forEach(element => {
        
        var temp = {
            attendancePercentage: Number,
            date: String
        }

        temp.date = element.date.split('T')[0]
        temp.attendancePercentage = ((element.squadCount / process.env.FOXTROT.toString().split(',').length) * 100)

        chartData.unshift(temp)

    })
    logger.trace('chartData' + JSON.stringify(chartData), 'webserver/foxtrot')

    res.render('foxtrot', {
        serverLogs: serverLogs,
        chartData: JSON.stringify(chartData)
    })
        
})

var port = process.env.WEB_PORT
app.listen(port, () => {
    logger.info('Webserver up on port ' + port, 'webserver')
})