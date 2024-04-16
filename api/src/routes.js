const Router = require('koa-router');
const flights = require('./routes/flights');

const router = new Router();

router.use('/flights', flights.routes());

module.exports = router;