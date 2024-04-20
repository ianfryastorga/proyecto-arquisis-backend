const Router = require('koa-router');

const router = new Router();

router.post('validations.create', '/', async (ctx) => {
  try {
    const validation = await ctx.orm.Validation.create(ctx.request.body);
    const { status } = validation;

    if (status === true) {
      // Manejar la compra en base de datos y cambiar estado en front
    } else {
      // Habilitar pasaje para ser comprado y cambiar estado en front
    }

    ctx.body = validation;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

// POST /validations

module.exports = router;
