const Router = require('koa-router');
const axios = require('axios');
const moment = require('moment');

const router = new Router();

// eslint-disable-next-line consistent-return
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

    let updatedBooked = flight.booked;

    if (request.seller === 11) {
      updatedBooked -= request.quantity;
    }

    const updatedQuantity = flight.quantity + request.quantity;
    await axios.patch(`${process.env.API_URL}/flights/${flight.id}`, { quantity: updatedQuantity, booked: updatedBooked });
    console.log('Flight updated:', flight.id);
  } catch (error) {
    console.error('Error updating flight:', error);
  }
}

async function createFlightRecommendations(request) {
  try {
    console.log('Creating flight recommendations');
    const flight = await findFlight(request);
    const { username } = request;
    const { ipAddress } = request;
    await axios.post(`${process.env.JOBS_MASTER_URL}/job`, { flight, username, ipAddress });
  } catch (error) {
    console.error('Error sending flight info to JobsMaster:', error);
  }
}

router.post('validations.create', '/', async (ctx) => {
  try {
    console.log(ctx.request.body);
    const validation = await ctx.orm.Validation.create(ctx.request.body);
    const { valid } = validation;
    const { requestId } = validation;

    const response = await axios.get(`${process.env.API_URL}/requests/${requestId}`);
    const request = response.data;

    if (!valid) {
      console.log(`Compra rechazada para request ${requestId}`);
      await axios.patch(`${process.env.API_URL}/requests/${requestId}`, { status: 'rejected' });
      await findFlightAndUpdateQuantity(request);
      ctx.body = validation;
      ctx.status = 201;
      return;
    }

    console.log(`Compra aceptada para request ${requestId}`);
    await axios.patch(`${process.env.API_URL}/requests/${requestId}`, { status: 'accepted' });

    if (request.groupId === '11') {
      createFlightRecommendations(request);
    }
    ctx.body = validation;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

module.exports = router;
