const Router = require('koa-router');
const moment = require('moment-timezone');
const { Op } = require('sequelize');

const router = new Router();

router.post('flights.create', '/', async (ctx) => {
  try {
    const flight = await ctx.orm.Flight.create(ctx.request.body);
    ctx.body = flight;
    // console.log(body);
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

// Endpoint para mostrar lista de vuelos paginada, maximo 25 vuelos por página.
// Permite filtrar vuelos segun departureAirportId, arrivalAirportId, departureDate
// ejemplo1: {url}/flights?page=2&count=25
// ejemplo2: {url}/flights?departure=LIS&arrival=GRU&date=2024-03-14
router.get('flights.list', '/', async (ctx) => {
  try {
    const page = parseInt(ctx.query.page) || 1;
    const count = parseInt(ctx.query.count) || 25;
    const offset = (page - 1) * count;

    const { departure } = ctx.query;
    const { arrival } = ctx.query;
    const { date } = ctx.query;

    const filterOptions = {};
    if (departure) filterOptions.departureAirportId = departure;
    if (arrival) filterOptions.arrivalAirportId = arrival;
    if (date) {
      const currentDate = moment().tz('America/Santiago').toDate();
      const filterDate = moment.utc(date).toDate();
      if (moment(filterDate).isSameOrAfter(currentDate, 'day')) {
        filterOptions.departureTime = {
          [Op.gte]: moment(date).startOf('day').toDate(),
          [Op.lte]: moment(date).endOf('day').toDate(),
        };
      } else {
        ctx.body = { error: 'Invalid date' };
        ctx.status = 400;
        return;
      }
    }

    const flights = await ctx.orm.Flight.findAndCountAll({
      where: filterOptions,
      limit: count,
      offset,
      order: [['departuraTime', 'ASC']],
    });

    const totalCount = await ctx.orm.Flight.count({
      where: filterOptions});

    let lastUpdate;
    if (flights.count > 0) {
      lastUpdate = moment(flights.rows[0].createdAt).tz('America/Santiago');
    } else {
      lastUpdate = new Date();
    }

    ctx.body = {
      lastUpdate: lastUpdate,
      page: page,
      count: count,
      totalCount: totalCount,
      flights: flights.rows,
    };
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});

router.get('flight.show', '/:id', async (ctx) => {
  try {
    const flight = await ctx.orm.Flight.findOne({
      where: { id: ctx.params.id },
    });
    if (flight) {
      ctx.body = flight;
      ctx.status = 200;
    } else {
      ctx.body = { error: 'Flight not found' };
      ctx.status = 404;
    }
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});

module.exports = router;
