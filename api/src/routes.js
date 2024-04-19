const Router = require('koa-router');
const flights = require('./routes/flights');
const requests = require('./routes/requests');
const validations = require('./routes/validations');

const router = new Router();

router.use('/flights', flights.routes());
router.use('/requests', requests.routes());
router.use('/validations', validations.routes());

module.exports = router;
