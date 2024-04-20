const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const router = new Router();

router.post('requests.create', '/', async (ctx) => {
  try {
    // console.log(ctx.request.body)
    if (ctx.request.body.groupId === '11') {
      ctx.request.body.requestId = uuidv4();
    } 
    const request = await ctx.orm.Request.create(ctx.request.body);
    const { groupId } = request;
    console.log(groupId)

    if (groupId === '11') {
      console.log('HOLA')
      await axios.post(process.env.REQUEST_URL, request);
    }
    ctx.body = request;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

module.exports = router;
