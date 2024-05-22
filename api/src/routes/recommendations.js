const Router = require('koa-router');

const router = new Router();

router.post('recommendations.create', '/', async (ctx) => {
    try {
        console.log(ctx.request.body);
        const recommendation = await ctx.orm.Recommendation.create(ctx.request.body);
        ctx.body = recommendation;
        ctx.status = 201;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});

router.get('recommendations.list', '/', async (ctx) => {
    try {
        const { username } = ctx.query;
        if (!username) {
            ctx.status = 400;
            ctx.body = { error: 'Invalid username' };
            return;
        }
        const recommendations = await ctx.orm.Recommendation.findAll({
            where: { username },
            limit: 9,
            order: [['createdAt', 'DESC']],
        });
        
        const flightsRecommendations = await Promise.all(
            recommendations.map(async recommendation => {
                const flight = await ctx.orm.Flight.findByPk(recommendation.flightId);
                return { recommendation, flight };
            })
        );

        ctx.body = flightsRecommendations;
        ctx.status = 200;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 500;
    }
});

module.exports = router;