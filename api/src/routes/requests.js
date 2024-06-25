/* eslint camelcase: "off" */
const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment-timezone');
const { tx } = require('../utils/trx');

const router = new Router();

router.post('requests.create', '/', async (ctx) => {
  try {
    // console.log(ctx.request.body)
    if (ctx.request.body.groupId === '11') {
      ctx.request.body.requestId = uuidv4();
      ctx.request.body.datetime = moment().tz('America/Santiago').format();
    }
    let request = await ctx.orm.Request.create(ctx.request.body);
    const { groupId } = request;
    const { quantity } = request;

    if (groupId === '11' && quantity > 0) {
      const amount = Number(ctx.request.body.price) * Number(quantity);
      const trx = await tx.create(
        `Grupo11-${request.id}`,
        'entrega1_grupo11',
        amount,
        process.env?.FRONTEND_REDIRECT_URL
          || 'http://localhost:5173/purchaseCompleted',
      );
      await ctx.orm.Request.update(
        { depositToken: trx.token, url: trx.url, amount },
        { where: { requestId: request.requestId } },
      );
      request = await ctx.orm.Request.findOne({
        where: { requestId: request.requestId },
      });

      if (!request.isBooked) {
        await axios.post(process.env.REQUEST_URL, request);
      }
    }
    ctx.body = request;
    ctx.status = 201;
  } catch (error) {
    console.log(error.message);
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

async function findFlightAndUpdateBookedQuantity(request, ctx) {
  try {
    const flight = await ctx.orm.Flight.findOne({
      where: {
        departureAirportId: request.departureAirport,
        arrivalAirportId: request.arrivalAirport,
        departureTime: moment(request.departureTime).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
      },
    });

    const updatedBooked = flight.booked - request.quantity;

    await flight.update({ booked: updatedBooked });
    console.log('Flight updated:', flight.id);
  } catch (error) {
    console.error('Error updating flight:', error);
  }
}

router.post('requests.commit', '/commit', async (ctx) => {
  const { ws_token, tbk_token } = ctx.request.body;
  if (!ws_token || ws_token === '') {
    console.log('Transaccion anulada por el usuario');
    if (tbk_token) {
      const cancelledRequest = await ctx.orm.Request.findOne({
        where: { depositToken: tbk_token },
      });

      if (!cancelledRequest.isBooked) {
        await axios.post(process.env.VALIDATION_URL, {
          request: cancelledRequest,
          valid: false,
        });
      } else {
        await cancelledRequest.update({ status: 'rejected' });
      }
    }
    ctx.body = {
      message: 'Transaccion anulada por el usuario',
    };
    ctx.status = 200;
    return;
  }
  const confirmedTx = await tx.commit(ws_token);
  const request = await ctx.orm.Request.findOne({
    where: { depositToken: ws_token },
  });
  if (confirmedTx.response_code !== 0) {
    // Rechaza la compra
    if (!request.isBooked) {
      await axios.post(process.env.VALIDATION_URL, {
        request,
        valid: false,
      });
    } else {
      await request.update({ status: 'rejected' });
    }
    ctx.body = {
      message: 'Transaccion ha sido rechazada',
    };
    ctx.status = 200;
    return;
  }
  if (!request.isBooked) {
    await axios.post(process.env.VALIDATION_URL, {
      request,
      valid: true,
    });
  } else {
    await request.update({ status: 'accepted' });
    await findFlightAndUpdateBookedQuantity(request, ctx);
  }
  ctx.body = {
    message: 'Transaccion ha sido aceptada',
  };
  ctx.status = 200;
});

router.patch('requests.update', '/:requestId', async (ctx) => {
  try {
    const request = await ctx.orm.Request.findOne({
      where: { requestId: ctx.params.requestId },
    });
    if (!request) {
      ctx.body = { error: 'Request not found' };
      ctx.status = 404;
      return;
    }
    await request.update(ctx.request.body);
    ctx.body = request;
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

router.get('requests.showGroup', '/group', async (ctx) => {
  try {
    const requests = await ctx.orm.Request.findAll({
      where: { seller: 11, status: 'accepted'},
    });
    ctx.body = requests;
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

router.get('requests.show', '/:requestId', async (ctx) => {
  try {
    const request = await ctx.orm.Request.findOne({
      where: { requestId: ctx.params.requestId },
    });
    if (request) {
      ctx.body = request;
      ctx.status = 200;
    } else {
      ctx.body = { error: 'Request not found' };
      ctx.status = 404;
    }
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

router.get('requests.list', '/', async (ctx) => {
  try {
    const { username } = ctx.query;
    if (username) {
      const requests = await ctx.orm.Request.findAll({
        where: { username },
      });
      ctx.body = requests;
      ctx.status = 200;
    } else {
      ctx.status = 400;
      ctx.body = { error: 'Invalid username' };
    }
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});

module.exports = router;
