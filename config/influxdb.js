const influx = require('influx')

const client = new influx.InfluxDB({
    database: 'weather',
    host: 'localhost',
    username: "weather",
    password: 'weather890890',
    port: 8086
})

const getClient = () => {
    return client;
}

module.exports.getClient = getClient;