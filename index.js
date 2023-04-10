const Gamedig = require('gamedig');
const mongoose = require('mongoose')
const fs = require('fs')
const ServerState = require('./stateModel')
const nodeCron = require('node-cron')

async function connectToDB() {
    await mongoose.connect('mongodb+srv://elduko:gibaccessplz@attendance-tracker.ae7rj5p.mongodb.net/attendance-tracker')
    console.log('Connected to DB')
}

connectToDB().catch(err => {console.log(err)})

//Cron job for Europe/Sofia timezone: 59 00 21 * * SAT,SUN
nodeCron.schedule('59 54 12 * * *',() => {

    Gamedig.query({
        type: 'arma3',
        host: '109.121.215.76' //TAS 82.168.208.164
    }).then((state) => {
        dataReady(state)
    }).catch((error) => {
        console.error('Server is offline')
        console.log(error);
    });
    
},{
    scheduled: true,
    timezone: 'Europe/Sofia'
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