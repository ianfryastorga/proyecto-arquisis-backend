const Router = require('koa-router');
const axios = require('axios');
const moment = require('moment');

const router = new Router();

async function findFlightAndUpdateQuantity(request) {
  try {
    const response = await axios.get(`${process.env.API_URL}/flights/find`, {
      params: {
        departureAirportId: request.departureAirport,
        arrivalAirportId: request.arrivalAirport,
        departureTime: moment(request.departureTime).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
      },
    });

    const flight = response.data;

    const updatedQuantity = flight.quantity + request.quantity;
    await axios.patch(`${process.env.API_URL}/flights/${flight.id}`, { quantity: updatedQuantity });
    console.log('Flight updated:', flight.id);
  } catch (error) {
    console.error('Error updating flight:', error);
  }
}

router.post('validations.create', '/', async (ctx) => {
  try {
    const validation = await ctx.orm.Validation.create(ctx.request.body);
    const { valid } = validation;
    const { requestId } = validation;

    if (valid === true) {
      console.log(`Compra aceptada para request ${requestId}`);
      await axios.patch(`${process.env.API_URL}/requests/${requestId}`, { status: 'accepted' });
    } else {
      console.log(`Compra rechazada para request ${requestId}`);
      await axios.patch(`${process.env.API_URL}/requests/${requestId}`, { status: 'rejected' });
      const request = axios.get(`${process.env.API_URL}/requests/${requestId}`);
      findFlightAndUpdateQuantity(request);
      // Deshacer actualizacion de cantidad en vuelo
      // Status de la compra (request) rechazada
    }

    ctx.body = validation;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

module.exports = router;