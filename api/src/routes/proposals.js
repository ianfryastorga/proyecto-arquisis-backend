const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment-timezone');
const { where } = require('sequelize');

const router = new Router();

router.post('proposals.create', '/', async (ctx) => {
    try {
        const { groupId, auctionId } = ctx.request.body;

        const auction = await ctx.orm.Auction.findOne({
            where: { auctionId },
        });

        if (!auction) {
            ctx.body = { error: 'Auction not found' };
            ctx.status = 404;
            return;
        }

        if (groupId !== '11' && auction.groupId !== '11') {
            ctx.body = { error: 'Proposal is not from group 11 or auction is not from group 11' };
            ctx.status = 400;
            return;
        }   

        const proposal = await ctx.orm.Proposal.create(ctx.request.body);
        ctx.body = proposal;
        ctx.status = 201;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});

router.post('proposals.submit', '/submit', async (ctx) => {
    try {
        const proposalData = ctx.request.body;
        const proposal = {
            proposalId: uuidv4(),
            type: 'proposal',
            groupId: '11',
            ...proposalData
        }
        await axios.post(process.env.AUCTION_PROPOSAL_URL, proposal);
        ctx.body = proposal;
        ctx.status = 201;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});

router.get('proposals.list', '/', async (ctx) => {
    try {
        const proposals = await ctx.orm.Proposal.findAll();
        ctx.body = proposals;
        ctx.status = 200;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 500;
    }
});

router.get('proposals.show', '/:proposalId', async (ctx) => {
    try {
        const proposal = await ctx.orm.Proposal.findOne({
            where: { proposalId: ctx.params.proposalId },
        });
        if (!proposal) {
            ctx.body = { error: 'Proposal not found' };
            ctx.status = 404;
            return;
        }
        ctx.body = proposal;
        ctx.status = 200;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 500;
    }
});

router.get('proposals.listByAuction', '/auction/:auctionId', async (ctx) => {
    try {
        const proposals = await ctx.orm.Proposal.findAll({
            where: { auctionId: ctx.params.auctionId },
        });
        ctx.body = proposals;
        ctx.status = 200;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 500;
    }
});

router.post('proposals.submitResponse', '/submitResponse', async (ctx) => {
    try { 
        const response = ctx.request.body;
        await axios.post(process.env.AUCTION_PROPOSAL_URL, {
            groupId: '11',
            ...response
        });
        ctx.body = response;
        ctx.status = 200;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});

// eslint-disable-next-line consistent-return
async function findFlight(request) {
    try {
      const flight = await ctx.orm.Flight.findOne({
        where: {
          departureAirportId: request.departureAirport,
          arrivalAirportId: request.arrivalAirport,
          departureTime: moment(request.departureTime).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
        },
      });

      if (!flight) {
        ctx.body = { error: 'Flight not found' };
        ctx.status = 404;
        return;
      }
      
      return flight;

    } catch (error) {
      ctx.body = { error: error.message };
      ctx.status = 500;
    }
}

async function updateFlightsAvailability(auction, proposal) {
    try {
        const auctionFlight = await findFlight(auction);
        const proposalFlight = await findFlight(proposal);

        if (auction.groupId === '11') {
            const updatedAuctionQuantity = auctionFlight.booked - auction.quantity;
            await auctionFlight.update({ booked: updatedAuctionQuantity });

            const updatedProposalQuantity = proposalFlight.booked + proposal.quantity;
            await proposalFlight.update({ booked: updatedProposalQuantity });
        } else if (proposal.groupId === '11') {
            const updatedAuctionQuantity = auctionFlight.booked + auction.quantity;
            await auctionFlight.update({ booked: updatedAuctionQuantity });

            const updatedProposalQuantity = proposalFlight.booked - proposal.quantity;
            await proposalFlight.update({ booked: updatedProposalQuantity });
        }
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 500;
    }
}

async function deleteProposals(auction) {
    const proposals = await ctx.orm.Proposal.findAll({
        where: { auctionId: auction.auctionId },
    });

    for (const proposal of proposals) {
        await proposal.destroy();
    }
}

async function handleProposalAcceptance(response, auction) {
    try {
        const auctionGroup = auction.groupId;
    
        const proposal = await ctx.orm.Proposal.findOne({
            where: { proposalId: response.proposalId },
        });
    
        // Aceptamos la propuesta de otro grupo
        if (auctionGroup === '11') {
            await updateFlightsAvailability(auction, proposal);   
            await deleteProposals(auction);
            await auction.destroy();
            
            return;
        }
    
        // Otro grupo acepta nuestra propuesta
        if (proposal) {
            await updateFlightsAvailability(auction, proposal);
            await deleteProposals(auction);
            await auction.destroy();
            return;
        }
    
        // Otro grupo acepta otra propuesta (no nuestra)
        await deleteProposals(auction);
        await auction.destroy();
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
}

async function handleProposalRejection(response) {
    const proposal = await ctx.orm.Proposal.findOne({
        where: { proposalId: response.proposalId },
    });

    if (proposal) {
        await proposal.destroy();
    }
}

router.post('proposals.handleResponse', '/handleResponse', async (ctx) => {
    try {
        const response = ctx.request.body;
        const auction = await ctx.orm.Auction.findOne({
            where: { auctionId: proposal.auctionId },
        });
        if (!auction) {
            ctx.body = { error: 'Auction not found' };
            ctx.status = 404;
            return;
        }
        
        if (response.type === 'acceptance') {
            await handleProposalAcceptance(response, auction);
        } else if (response.type === 'rejection') {
            await handleProposalRejection(response);
        }
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});



module.exports = router;