require('dotenv').config()
const Gamedig = require('gamedig');
const mongoose = require('mongoose')
const fs = require('fs')
const ServerState = require('./stateModel')
const nodeCron = require('node-cron')

async function connectToDB() {
    await mongoose.connect(process.env.MONGO_CONNECTION)
    console.log('Connected to DB')
}

connectToDB().catch(err => {console.log(err)})

nodeCron.schedule(process.env.CRON_SCHEDULE,() => {

    Gamedig.query({
        type: 'arma3',
        host: process.env.SERVER_IP.toString()
    }).then((state) => {
        dataReady(state)
    }).catch((error) => {
        console.error('Server is offline')
        console.log(error);
    });
    
},{
    scheduled: true,
    timezone: process.env.CRON_TIMEZONE
})

function dataReady(data) {
    
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

    console.log(dataSet)

    logServerState(dataSet)

}

async function logServerState(serverData) {
    
    var date = new Date().toISOString()

    fs.writeFile('./server-logs/' + date + '.json',JSON.stringify(serverData), err => {
        if(err != null){
            console.error(err)
        }
    })

    const serverState = new ServerState(serverData)
    await serverState.save()
    console.log('Saved server state to DB')

}