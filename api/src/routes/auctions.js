const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment-timezone');
const { isAdmin, verifyToken } = require('../utils/authorization');

const router = new Router();

router.post('auctions.create', '/', async (ctx) => {
    try {
        const auction = await ctx.orm.Auction.create(ctx.request.body);
        if (auction.groupId === 11) {
            const flight = await ctx.orm.Flight.findOne({
                where: {
                departureAirportId: auction.departureAirport,
                arrivalAirportId: auction.arrivalAirport,
                departureTime: moment(auction.departureTime).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
                },
            });
            const booked = flight.booked - auction.quantity;
            await flight.update({ booked: booked });
        }
        ctx.body = auction;
        ctx.status = 201;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});

router.post('auctions.submit', '/submit', async (ctx) => {
    try {
        console.log(ctx.request.body);
        const auctionData = ctx.request.body;
        const auction = {
            auctionId: uuidv4(),
            proposalId: '',
            type: 'offer',
            ...auctionData
        }
        console.log(auction);
        await axios.post(process.env.AUCTION_PROPOSAL_URL, auction);
        ctx.body = auction;
        ctx.status = 201;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});

// Subastas de otros grupos
router.get('auctions.listOthers', '/others', isAdmin, async (ctx) => {
    try {
        const auctions = await ctx.orm.Auction.findAll();
        const auctionsFiltered = auctions.filter(auction => auction.groupId !== 11);
        ctx.body = auctionsFiltered;
        ctx.status = 200;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 500;
    }
});

router.get('auctions.listAdmin', '/', async (ctx) => {
    try {
        const auctions = await ctx.orm.Auction.findAll({
            where: { groupId: 11 },
        });
        ctx.body = auctions;
        ctx.status = 200;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 500;
    }
});

router.get('auctions.show', '/:auctionId', async (ctx) => {
    try {
        const auction = await ctx.orm.Auction.findOne({
            where: { auctionId: ctx.params.auctionId },
        });
        if (!auction) {
            ctx.body = { error: 'Auction not found' };
            ctx.status = 404;
            return;
        }
        ctx.body = auction;
        ctx.status = 200;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 500;
    }
});

module.exports = router;