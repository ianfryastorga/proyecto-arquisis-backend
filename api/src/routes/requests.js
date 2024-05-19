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
    const request = await ctx.orm.Request.create(ctx.request.body);
    const { groupId } = request;
    const { quantity } = request;

    if (groupId === '11' && quantity > 0 && quantity <= 4) {
      await axios.post(process.env.REQUEST_URL, request);
      const amount = Number(ctx.request.body.price) * Number(quantity);
      const trx = await tx.create(request.requestId, "entrega1_grupo11", amount, process.env?.FRONTEND_REDIRECT_URL || "http://localhost:5173/purchase-done");
      await ctx.orm.Request.update(
        { token: trx.token, url: trx.url, amount: amount}, 
        {
          where: {
            requestId: request.requestId,
          },
        }
      );
      const request = await ctx.orm.Request.findOne({ where: { requestId: request.requestId } });
    }
    ctx.body = request;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

router.post('requests.commit', '/commit', async (ctx) => {
  const { ws_token } = ctx.request.body;
  if (!ws_token || ws_token == "") {
    ctx.body = {
      message: "Transaccion anulada por el usuario"
    };
    ctx.status = 200;
    return;
  }
  const confirmedTx = await tx.commit(ws_token);

  const validation = await ctx.orm.Requests.findOne({ where: { token: ws_token } });

  if (confirmedTx.response_code != 0) { // Rechaza la compra
    validation.valid = false;
    await axios.post(process.env.VALIDATION_URL, { ws_token, validation });
    ctx.body = {
      message: "Transaccion ha sido rechazada",
    };
    ctx.status = 200;
    return;
  }
  validation.valid = true;
  await axios.post(process.env.VALIDATION_URL, { ws_token, validation });

  ctx.status = 200;
  ctx.body = {
    message: "Transaccion ha sido aceptada",
  };
  return;
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
