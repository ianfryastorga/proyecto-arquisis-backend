const Router = require('koa-router');
const flights = require('./routes/flights');
const requests = require('./routes/requests');
const validations = require('./routes/validations');
const recommendations = require('./routes/recommendations');

const router = new Router();

router.use('/flights', flights.routes());
router.use('/requests', requests.routes());
router.use('/validations', validations.routes());
router.use('/recommendations', recommendations.routes());

module.exports = router;
