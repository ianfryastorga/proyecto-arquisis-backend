const mqtt = require("mqtt");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const HOST = 'broker.iic2173.org';
const PORT = 9000;
const USER = 'students';
const PASSWORD = 'iic2173-2024-1-students';
const TOPIC = 'flights/requests';

const client = mqtt.connect(`mqtt://${HOST}:${PORT}`, {
    username: USER,
    password: PASSWORD,
});

client.on('connect', () => {
    console.log('Connected to MQTT broker');

    client.subscribe(TOPIC, (err) => {
        if (err) {
            console.error('Error subscribing to topic', err);
        } else {
            console.log(`Subscribed to topic ${TOPIC}`);
        }
    });
});

client.on('message', (topic, message) => {
    // Logica para recibir mensaje del broker
});

async function sendRequestToBroker(request) {
    // Logica para enviar solicitud al broker
}

module.exports = client;