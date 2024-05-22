/* eslint no-restricted-syntax: "off" */
/* eslint no-await-in-loop: "off" */
/* eslint-disable no-shadow */
const { Worker, Job } = require('bullmq');
const axios = require('axios');
const dotenv = require('dotenv');
const { Sequelize, QueryTypes } = require('sequelize');

dotenv.config();

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

console.log('Starting worker...');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    // port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
  },
);

async function getIpLocation(ipAddress) {
  const response = await axios.get(`http://ip-api.com/json/${ipAddress}`);
  const { lat, lon } = response.data;
  console.log(`IP Location: ${lat}, ${lon}`);
  return { lat, lon };
}

async function getLastFlightInfo(flight) {
  const arrivalAirport = flight.arrivalAirportId;
  const arrivalTime = new Date(flight.arrivalTime);
  return { arrivalAirport, arrivalTime };
}

async function get20LatestFlights(arrivalAirport, arrivalTime) {
  const oneWeekLater = new Date(arrivalTime);
  oneWeekLater.setDate(arrivalTime.getDate() + 7);

  const query = `
    SELECT * FROM "Flights" 
    WHERE "departureAirportId" = :arrivalAirport 
      AND "departureTime" BETWEEN :arrivalTime AND :oneWeekLater 
    LIMIT 20
  `;
  const flights = await sequelize.query(query, {
    replacements: { arrivalAirport, arrivalTime, oneWeekLater },
    type: QueryTypes.SELECT,
  });
  return flights;
}

async function getAirportCoordinates(airportName) {
  try {
    const apiKey = process.env.GEOCODE_API_KEY;
    const response = await axios.get(
      `https://geocode.maps.co/search?q=${encodeURIComponent(
        airportName,
      )}&api_key=${apiKey}`,
    );
    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { lat, lon };
    }
    throw new Error('No se encontraron coordenadas para el aeropuerto');
  } catch (error) {
    console.error(error.message);
    throw new Error(
      'Error al obtener coordenadas del aeropuerto:',
      error.message,
    );
  }
}

async function processFlights(flights) {
  const results = [];
  for (const flight of flights) {
    try {
      const arrivalCoords = await getAirportCoordinates(
        flight.arrivalAirportName,
      );
      results.push({ ...flight, arrivalCoords });
      await sleep(1000);
    } catch (error) {
      console.error(`Error processing flight ${flight.id}: ${error.message}`);
    }
  }
  return results;
}

async function calculateDistance(ipCoord, flightCoord) {
  const latIp = (ipCoord.lat * Math.PI) / 180;
  const lonIp = (ipCoord.lon * Math.PI) / 180;
  const latFlight = (flightCoord.lat * Math.PI) / 180;
  const lonFlight = (flightCoord.lon * Math.PI) / 180;

  const dLat = latFlight - latIp;
  const dLon = lonFlight - lonIp;

  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(latIp) * Math.cos(latFlight) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));

  const r = 6371;

  return c * r;
}

async function saveRecommendation(username, flightId) {
  try {
    const response = await axios.post(
      `${process.env.API_URL}/recommendations`,
      { username, flightId },
    );
    console.log(`Recommendation saved: ${response.data.id}`);
  } catch (error) {
    console.error(`Error saving recommendation: ${error.message}`);
    throw error;
  }
}

async function processor(job) {
  try {
    const { flight, username, ipAddress } = job.data;
    console.log(`Processing job for user ${username}`);

    const ipCoord = await getIpLocation(ipAddress);
    const { arrivalAirport, arrivalTime } = await getLastFlightInfo(flight);
    const latestFlights = await get20LatestFlights(arrivalAirport, arrivalTime);
    const flightsWithCoords = await processFlights(latestFlights);

    const recommendations = await Promise.all(
      flightsWithCoords.map(async (flight) => {
        const distance = await calculateDistance(ipCoord, flight.arrivalCoords);
        const { price } = flight;
        const pond = distance / price;

        return { flight, pond };
      }),
    );

    const sortedRecommendations = recommendations
      .sort((a, b) => b.pond - a.pond)
      .slice(0, 3);

    await Promise.all(
      recommendations.map(async (recommendation) => {
        await saveRecommendation(username, recommendation.flight.id);
      }),
    );

    return sortedRecommendations;
  } catch (error) {
    console.log(`Error processing job: ${error.message}`);
    throw error;
  }
}

const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
};

const worker = new Worker('recommendationQueue', processor, {
  autorun: false,
  connection,
});

console.log('Worker Listening to Jobs...');

worker.on('completed', (job, returnvalue) => {
  console.log(`Worker completed job ${job.id} with result ${returnvalue}`);
});

worker.on('failed', (job, error) => {
  console.log(`Worker completed job ${job.id} with error ${error}`);
});

worker.on('error', (err) => {
  console.error(err);
});

worker.run();

async function shutdown() {
  console.log('Received SIGTERM signal. Gracefully shutting down...');

  await worker.close();

  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
