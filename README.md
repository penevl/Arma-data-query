# Arma-data-query
Arma data query is a nodejs application used to periodically query arma3 servers and then log that data to a MongoDB database.
# Features
1. Periodically log arma3 server states using cron
2. Save that data to a MongoDB database
3. A web interface to display said data
4. Display the attendance of squad members
# Set up
## Step 1. Downloading

You can either download the tool from the releases section and then extract that .zip or option two, if you have git installed, is to issue the command
```sh
git clone https://github.com/penevl/Arma-data-query.git
```

## Step 2. Installing dependencies

To download all the required dependencies go to the root directory of the application and issue the command 

```sh
npm install
```

You will also need npm and nodejs(Minimum required version is 16.X)

## Step 3. Creating the config file configuring the app

Once you have downloaded the tool rename the file `.env.example` to `.env`. In there you have 8 properites you can configure:
1. MONGO_CONNECTION - The URL of the mongodb server you wish to use along with the connection username and password. Example: `mongodb+srv://USERNAME:PASSWORD@attendance-tracker.mongodb.net/attendance-tracker`
2. SERVER_IP - The IP of the server you wish to query. **HAS TO BE AN IP AND NOT A URL**
3. CRON_SCHEDULE - The cronjob for when the server will be queried. Example: `59 00 21 * * SAT,SUN` will query the server every Saturday and Sunday at 21:00
4. CRON_TIMEZONE - The timezone you are in. Example: `Europe/Sofia`
5. LOG_LEVEL - Available values are: TRACE, INFO, WARN, ERROR
6. WEB_PORT - The port on which the web server will be served
7. ECHO and FOXTROT - The names of the players in each squad for whom you want to track attendance seperated by commas. Example: ElDuko,Sharp,conner
   > Note 1. The tracker strips all player tags(i.e [TAS] ElDuko becomes ElDuko)
   
   
   > Note 2. This is case sensitive
## Step 4. Running

To run just execute and the app will run until stopped. 

```sh
node ./index.js
```
