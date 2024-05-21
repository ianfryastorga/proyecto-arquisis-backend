const Router = require('koa-router');
const axios = require('axios');
const moment = require('moment');

const router = new Router();

async function findFlight(request) {
  try {
    const response = await axios.get(`${process.env.API_URL}/flights/find`, {
      params: {
        departureAirportId: request.departureAirport,
        arrivalAirportId: request.arrivalAirport,
        departureTime: moment(request.departureTime).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error finding flight:', error);
  }
}

async function findFlightAndUpdateQuantity(request) {
  try {
    const flight = await findFlight(request);

    const updatedQuantity = flight.quantity + request.quantity;
    await axios.patch(`${process.env.API_URL}/flights/${flight.id}`, { quantity: updatedQuantity });
    console.log('Flight updated:', flight.id);
  } catch (error) {
    console.error('Error updating flight:', error);
  }
}

async function createFlightRecommendations(request) {
  try {

    const flight = await findFlight(request);
    const username = request.username;
    const ipAddress = request.ipAddress;
    await axios.post(`${process.env.JOBS_MASTER_URL}/job`, { flight, username, ipAddress });
    
  } catch (error) {
    console.error('Error sending flight info to JobsMaster:', error);
  }
}

router.post('validations.create', '/', async (ctx) => {
  try {

    const validation = await ctx.orm.Validation.create(ctx.request.body);
    const { valid } = validation;
    const { requestId } = validation;

    const request = axios.get(`${process.env.API_URL}/requests/${requestId}`);

    if (!valid) {
        console.log(`Compra rechazada para request ${requestId}`);
        await axios.patch(`${process.env.API_URL}/requests/${requestId}`, { status: 'rejected' });
        findFlightAndUpdateQuantity(request);
        return;
    }

    console.log(`Compra aceptada para request ${requestId}`);
    await axios.patch(`${process.env.API_URL}/requests/${requestId}`, { status: 'accepted' });

    if (request.gropuId === '11') {
      createFlightRecommendations(request)
    }
    ctx.body = validation;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

module.exports = router;
