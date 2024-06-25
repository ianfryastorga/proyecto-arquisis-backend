const Router = require('koa-router');
const flights = require('./routes/flights');
const requests = require('./routes/requests');
const validations = require('./routes/validations');
const recommendations = require('./routes/recommendations');
const auctions = require('./routes/auctions');
const proposals = require('./routes/proposals');

const router = new Router();

router.use('/flights', flights.routes());
router.use('/requests', requests.routes());
router.use('/validations', validations.routes());
router.use('/recommendations', recommendations.routes());
router.use('/auctions', auctions.routes());
router.use('/proposals', proposals.routes());

module.exports = router;
