const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment-timezone');

const router = new Router();

router.post('auctions.create', '/', async (ctx) => {
    try {
        const auction = await ctx.orm.Auction.create(ctx.request.body);
        ctx.body = auction;
        ctx.status = 201;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});

router.post('auctions.submit', '/submit', async (ctx) => {
    try {
        const auctionData = ctx.request.body;
        const auction = {
            auctionId: uuidv4(),
            proposalId: '',
            type: 'offer',
            groupId: '11',
            ...auctionData
        }
        await axios.post(process.env.AUCTION_PROPOSAL_URL, auction);
        ctx.body = auction;
        ctx.status = 201;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});

router.get('auctions.list', '/', async (ctx) => {
    try {
        const auctions = await ctx.orm.Auction.findAll();
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