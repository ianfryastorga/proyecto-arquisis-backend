const { Worker, Job } = require('bullmq');
const axios = require('axios');
const dotenv = require('dotenv');
const { Sequelize, QueryTypes } = require('sequelize');

dotenv.config();

// function sleep(ms) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }

console.log("Starting worker...");

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    // port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
});

async function getIpLocation(ipAddress) {
  const response = await axios.get(`http://ip-api.com/json/${ipAddress}`);
  const { lat, lon } = response.data;
  console.log(`IP Location: ${lat}, ${lon}`);
  return { lat, lon };
} // REVISAR

async function getLastFlightInfo(flight) {
  // Lógica para obtener la información del último vuelo comprado (arrivalAirport, arrivalTime)
  const arrivalAirport = flight.arrivalAirportId;
  const arrivalTime = new Date(flight.arrivalTime);
  return { arrivalAirport, arrivalTime };
}

async function get20LatestFlights(arrivalAirport, arrivalTime) {
  // Lógica para obtener los últimos 20 vuelos
  const oneWeekLater = new Date(arrivalTime);
  oneWeekLater.setDate(arrivalTime.getDate() + 7);

  const query = `
    SELECT * FROM flights 
    WHERE departureAirportId = :arrivalAirport 
      AND departureTime BETWEEN :arrivalTime AND :oneWeekLater 
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
    const response = await axios.get(`https://geocode.maps.co/geocode/search?q=${airportName}&api_key=${apiKey}`);
    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { lat, lon };
    } else {
      throw new Error('No se encontraron coordenadas para el aeropuerto');
    }
  } catch (error) {
    throw new Error('Error al obtener coordenadas del aeropuerto:', error.message);
  }
}

async function calculateDistance(ipCoord, flightCoord) {
  // Lógica para calcular la distancia entre dos coordenadas
  const latIp = ipCoord.lat * Math.PI / 180;
  const lonIp = ipCoord.lon * Math.PI / 180;
  const latFlight = flightCoord.lat * Math.PI / 180;
  const lonFlight = flightCoord.lon * Math.PI / 180;

  const dLat = latFlight - latIp;
  const dLon = lonFlight - lonIp;

  const a = Math.pow(Math.sin(dLat / 2), 2)
             + Math.cos(latIp) * Math.cos(latFlight)
             * Math.pow(Math.sin(dLon / 2), 2);

  const c = 2 * Math.asin(Math.sqrt(a));

  const r = 6371;

  return c * r;
}

async function processor(job) {
    // Logica para procesar el job y entregar recomendaciones
    try {
      const { flight, username, ipAddress } = job.data;
      console.log(`Processing job for user ${username}`);
      // Obtener ip coord
      const ipCoord = await getIpLocation(ipAddress);

      // Obtener last flight info
      const { arrivalAirport, arrivalTime } = await getLastFlightInfo(flight);

      // Obtener 20 latest flights
      const latestFlights = await get20LatestFlights(arrivalAirport, arrivalTime);

      // Obtener airport coordinates de los 20 vuelos
      const flightsWithCoords = await Promise.all(
        latestFlights.map(async flight => {
          const arrivalCoords = await getAirportCoordinates(flight.arrivalAirportName);
          return { ...flight, arrivalCoords };
        })
      );

      const recommendations = flightsWithCoords.map(flight => {
        const distance = calculateDistance(ipCoord, flight.arrivalCoords);
        const price = flight.price;
        const pond = distance / price;

        return { flight, pond };
      }).sort((a, b) => b.pond - a.pond).slice(0, 3);

      return recommendations;
      
    } catch (error) {
      console.log(`Error processing job: ${error.message}`);
      throw error;
    }
}

const connection = {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
};

const worker = new Worker("recommendationQueue", processor, {
    autorun: false,
    connection,
}); 

console.log("Worker Listening to Jobs...");

worker.on("completed", (job, returnvalue) => {
  console.log(`Worker completed job ${job.id} with result ${returnvalue}`);
});

worker.on("failed", (job, error) => {
  console.log(`Worker completed job ${job.id} with error ${error}`);
});

worker.on("error", (err) => {
  console.error(err);
});

worker.run();

async function shutdown() {
  console.log("Received SIGTERM signal. Gracefully shutting down...");

  await worker.close();

  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// COMPLETAR