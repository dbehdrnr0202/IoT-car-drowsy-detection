const mqtt = require('mqtt');
const mqttClient = mqtt.connect('mqtt://119.71.178.4:1883');

//For MongoDB Connection
const { MongoClient } = require('mongodb');
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
const dbName = 'team7db';

const topic = 'ALERT';

mqttClient.on('connect', () => {
    console.log('Connected to MQTT server');
    mqttClient.subscribe(topic, (err) => {
        if(err) console.log('Failed to subscribe topic');
        else console.log('Subscribed to topic');
    });
});

mqttClient.on('message', async (message) => {
    console.log('received', message);
    if(message.toString() == 'ALERT') {
        await mqttClient.publish('ALARM', 'alarm');
        console.log("published to ALARM message alarm");

        const db = client.db(dbName);
        const collection = db.collection('drowsyLog');
        const now = new Date();
        const result = collection.insertOne({'TYPE':'DROWSY', 'DATE': now.toLocaleString()});
    }
});
