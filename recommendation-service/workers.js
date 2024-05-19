const { Worker, Job } = require('bullmq');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// function sleep(ms) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }

async function getIpLocation(ipAddress) {
    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`);
    const { lat, lon } = response.data;
    return { lat, lon };
} // REVISAR

async function getLastFlightInfo(flight) {
    // Lógica para obtener la información del último vuelo comprado (arrivalAirport, arrivalTime)
}

async function getLatestFlights(destinationAirport, purchaseDate) {
    // Lógica para obtener los últimos 20 vuelos
}


async function processor(job) {
    // Logica para procesar el job y entregar recomendaciones
    const { flight, username, ipAddress } = job.data;
  
    try {
      
    } catch (error) {
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