const { Client, EmbedBuilder } = require('discord.js')

const client = new Client({intents: ['Guilds',  'GuildMessages', 'GuildMembers', 'MessageContent'] })

function initDiscord (logger) {
    
    logger.trace(`Attempting to log in to discord with token ${process.env.TOKEN}`)
    try {
        client.login(process.env.TOKEN)        
    } catch (err) {
        logger.error('Failed to log in to discord', 'discord')
    }

    client.on('ready', () => {
        logger.info(`Logged in to discord as ${client.user.username}`, 'discord')
        initBotFunctions()
    })

}

function initBotFunctions() {
    
    client.on('messageCreate', (message) => {
        let msgChannel = message.channel
        let msgGuild = message.guild
        let embed = new EmbedBuilder()
        embed.setColor('#4e2e9e')
        embed.setDescription('You have been kicked from the Autismo Seals server due to too much inactivity')
        embed.setTitle('Kicked due to inactivity')
        embed.setFields({name: 'Gay', value: 'Mega gay'})
        msgGuild.members.fetch().then(members => {
            var players = findByRoleId(members, '1030569486748758156')
            players.forEach(player => {
                console.log(`player ${player.playerName} with an id ${player.playerId} is a recruit`)
            })
        })  
        message.author.send({embeds: [embed]})
    })

}

function findByRoleId(members, roleID) {
   
    var toReturn = []

    members.forEach(member => {
        var temp = {
            playerName: String,
            playerId: Number
        }        
        if (member._roles.toString().includes(roleID)){
            temp.playerName = member.displayName
            temp.playerId = member.id
            toReturn.push(temp)
        }
    })

    return toReturn
}

module.exports = { initDiscord }