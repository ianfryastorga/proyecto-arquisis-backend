const mqtt = require("mqtt");
const dotenv = require("dotenv");
const axios = require("axios");
const Koa = require("koa");
const { koaBody } = require("koa-body");
const koaLogger = require("koa-logger");
const Router = require("koa-router");
const boddyParser = require("koa-bodyparser");

const app = new Koa();
const router = new Router();

app.use(koaLogger());
app.use(koaBody());
app.use(boddyParser());
app.use(router.routes());

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

function parseRequestData(requestData) {
    try {
        const requestString = JSON.parse(requestData);
        // Cambiar formato de fecha
        const request = {
            requestId: requestString.request_id,
            groupId: requestString.group_id,
            departureAirport: requestString.departure_airport,
            arrivalAirport: requestString.arrival_airport,
            departureTime: new Date(requestString.departure_time),
            datetime: requestString.datetime,
            depositToken: requestString.deposit_token,
            quantity: requestString.quantity,
            seller: requestString.seller,
        }
    // '2024-04-23T15:30:00'
        return request;
    } catch (error) {
        throw new Error(`Error parsing request data: ${error.message}`);
    }
}

client.on('message', (topic, message) => {
    console.log(`Received message on ${topic}:`, message.toString());
    try {
        const request = parseRequestData(message.toString());
        console.log('Request:', request);
        if (request.groupId !== "11") {
            console.log('Request does not belong to group 11');
            sendRequestToApi(request);
            return;
        }
        // Send request to API
        // Guardar en una base de datos, ver validacion y manejar
    } catch (error) {
        console.error('Error sending request to broker:', error);
    }
});

// Publicar nuestras requests
async function sendRequestToBroker(request) {
    try {
        const parsedRequest = {
            request_id: request.requestId,
            group_id: request.groupId,
            departure_airport: request.departureAirport,
            arrival_airport: request.arrivalAirport,
            departure_time: request.departureTime,
            datetime: request.datetime,
            deposit_token: request.depositToken,
            quantity: request.quantity,
            seller: request.seller,
        } 
        const requestData = JSON.stringify(parsedRequest); // Date Handle
        client.publish(TOPIC, requestData);
        console.log('Request published to broker:', requestData);
    } catch (error) {
        throw new Error(`Error publishing request to broker: ${error.message}`);
    }
}

async function sendRequestToApi(request) {
    try {
        const response = await axios.post(`${process.env.API_URL}/requests`, request);
        console.log('Request send to API:', response.data);
    } catch (error) {
        console.error('Error sending request to API:', error);
    }
}

router.post('/', async (ctx) => {
    try {
        const request = ctx.request.body;
        await sendRequestToBroker(request);
        ctx.body = request;
        ctx.status = 201;
    } catch (error) {
        ctx.body = { error: error };
        ctx.status = 400;
    }
});

app.listen(process.env.REQUEST_PORT, (err) => {
    console.log('Listening on port', process.env.REQUEST_PORT);
});

module.exports = client;