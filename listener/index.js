const mqtt = require('mqtt');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const HOST = 'broker.iic2173.org';
const PORT = 9000;
const USER = 'students';
const PASSWORD = 'iic2173-2024-1-students';
const TOPIC = 'flights/info';

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

function parseFlightData(flightData) {
  try {
    const flightsArray = JSON.parse(flightData[0].flights);
    const flightInfo = flightsArray[0];
    const departureAirport = flightInfo.departure_airport;
    const arrivalAirport = flightInfo.arrival_airport;

    let carbonEmission = null;
    if (flightData[0].carbonEmission) {
      try {
        const parsedCarbonEmission = JSON.parse(flightData[0].carbonEmission);
        carbonEmission = parsedCarbonEmission.this_flight;
      } catch (error) {
        console.error('Error parsing carbon emission data: ', error);
      }
    }

    const flight = {
      departureAirportName: departureAirport.name,
      departureAirportId: departureAirport.id,
      departureTime: new Date(departureAirport.time),
      arrivalAirportName: arrivalAirport.name,
      arrivalAirportId: arrivalAirport.id,
      arrivalTime: new Date(arrivalAirport.time),
      duration: flightInfo.duration,
      airplane: flightInfo.airplane,
      airline: flightInfo.airline,
      airlineLogo: flightInfo.airline_logo,
      price: flightData[0].price,
      carbonEmission,
      airlineLogoUrl: flightData[0].airlineLogo,
      currency: flightData[0].currency,
    };

    return flight;
  } catch (error) {
    throw new Error(`Error parsing flight data: ${error.message}`);
  }
}

async function sendFlightToAPI(flight) {
  try {
    const response = await axios.post(process.env.API_URL, flight);
    console.log('Flight send to API: ', response.data);
  } catch (error) {
    console.error('Error sending flight to API: ', error);
  }
}

client.on('message', (topic, message) => {
  console.log(`Received message on ${topic}: ${message.toString()}`);
  try {
    const flightData = JSON.parse(message.toString());
    const flight = parseFlightData(flightData);
    sendFlightToAPI(flight);
  } catch (error) {
    console.error('Error parsing message or sending flight to API: ', error);
  }
});

client.on('error', (error) => {
  console.error('Error connecting to MQTT broker: ', error);
});

module.exports = client;
