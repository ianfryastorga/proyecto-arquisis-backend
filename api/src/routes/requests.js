const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid'); 

const router = new Router();

router.post('requests.create', '/', async (ctx) => {
  try {
    ctx.request.body.request_id = uuidv4();
    const request = await ctx.orm.Request.create(ctx.request.body);
    const { groupId } = request;

    if (groupId === '11') {
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
