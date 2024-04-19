const Router = require('koa-router');

const router = new Router();

router.post('requests.create', '/', async (ctx) => {
  try {
    const request = await ctx.orm.Request.create(ctx.request.body);
    const { groupId } = request;

    if (groupId === '11') {
      // Agregar logica para enviar request al broker
    }
    ctx.body = request;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

module.exports = router;
