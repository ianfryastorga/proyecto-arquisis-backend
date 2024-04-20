const mqtt = require("mqtt");
const dotenv = require("dotenv");

dotenv.config();

const HOST = 'broker.iic2173.org';
const PORT = 9000;
const USER = 'students';
const PASSWORD = 'iic2173-2024-1-students';
const TOPIC = 'flights/validation';

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

function parseValidationData(validationData) {
    try {
        const validationString = JSON.parse(validationData);
        const validation = {
            requestId: validationString.request_id,
            groupId: validationString.group_id,
            seller: validationString.status,
            valid: validationString.valid,
        }
        return validation;
    } catch (error) {
        throw new Error(`Error parsing validation data: ${error.message}`);
    }
}

client.on('message', (topic, message) => {
    console.log(`Received message from topic ${topic}: ${message.toString()}`);
    try {
        const validation = parseValidationData(message.toString());
        // sendValidationToApi(validation);
        // Logica para confirmar compra o rechazar (atributo estado en front)
    } catch (error) {
        console.error(error.message);
    }
});

async function sendValidationToApi(validation) {
    try {
        const response = await axios.post(`${process.env.API_URL}/validations`, validation);
        console.log('Validation sent to API:', response.data);
    } catch (error) {
        console.error('Error sending validation to API:', error.message);
    }
}

module.exports = client;