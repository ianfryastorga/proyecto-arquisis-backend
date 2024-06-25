const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment-timezone');
const { where } = require('sequelize');
const { isAdmin, verifyToken } = require('../utils/authorization');

const router = new Router();

// eslint-disable-next-line consistent-return
async function findFlight(request, ctx) {
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

        if (groupId !== 11 && auction.groupId !== 11) {
            ctx.body = { error: 'Proposal is not from group 11 or auction is not from group 11' };
            ctx.status = 400;
            return;
        }

        const proposal = await ctx.orm.Proposal.create(ctx.request.body);

        if (groupId === 11) {
            const flight = await findFlight(proposal, ctx);
            const booked = flight.booked - proposal.quantity;
            await flight.update({ booked: booked });
        }
        ctx.body = proposal;
        ctx.status = 201;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});

router.post('proposals.submit', '/submit', isAdmin, async (ctx) => {
    try {
        const proposalData = ctx.request.body;
        const proposal = {
            proposalId: uuidv4(),
            type: 'proposal',
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

router.get('proposals.list', '/', isAdmin, async (ctx) => {
    try {
        const proposals = await ctx.orm.Proposal.findAll();
        ctx.body = proposals;
        ctx.status = 200;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 500;
    }
});

router.get('proposals.show', '/:proposalId', isAdmin, async (ctx) => {
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

router.get('proposals.listByAuction', '/auction/:auctionId', isAdmin, async (ctx) => {
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

router.post('proposals.submitResponse', '/submitResponse', isAdmin, async (ctx) => {
    try { 
        const response = ctx.request.body;
        await axios.post(process.env.AUCTION_PROPOSAL_URL, response);
        ctx.body = response;
        ctx.status = 200;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});

async function updateFlightsAvailability(auction, proposal, ctx) {
    try {
        const auctionFlight = await findFlight(auction, ctx);
        const proposalFlight = await findFlight(proposal, ctx);

        if (auction.groupId === 11) {
            const updatedProposalQuantity = proposalFlight.booked + proposal.quantity;
            await proposalFlight.update({ booked: updatedProposalQuantity });
        } else if (proposal.groupId === 11) {
            const updatedAuctionQuantity = auctionFlight.booked + auction.quantity;
            await auctionFlight.update({ booked: updatedAuctionQuantity });
        }
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 500;
    }
}

async function deleteProposals(auction, ctx) {
    const proposals = await ctx.orm.Proposal.findAll({
        where: { auctionId: auction.auctionId },
    });

    for (const proposal of proposals) {
        await proposal.destroy();
    }
}

async function updateBookedQuantityAfterRejection(auction, ctx) {
    const proposals = await ctx.orm.Proposal.findAll({
        where: { auctionId: auction.auctionId },
    });

    for (const proposal of proposals) {
        const flight = await findFlight(proposal, ctx);
        const updatedBooked = flight.booked + proposal.quantity;
        await flight.update({ booked: updatedBooked });
    }
}

async function handleProposalAcceptance(response, auction, ctx) {
    try {
        const auctionGroup = auction.groupId;
    
        const proposal = await ctx.orm.Proposal.findOne({
            where: { proposalId: response.proposalId },
        });
    
        // Aceptamos la propuesta de otro grupo
        if (auctionGroup === 11) {
            await updateFlightsAvailability(auction, proposal, ctx);   
            await deleteProposals(auction, ctx);
            await auction.destroy();
            
            return;
        }
    
        // Otro grupo acepta nuestra propuesta
        if (proposal) {
            await updateFlightsAvailability(auction, proposal, ctx);
            await deleteProposals(auction, ctx);
            await auction.destroy();
            return;
        }
    
        // Otro grupo acepta otra propuesta (no nuestra)
        await updateBookedQuantityAfterRejection(auction, ctx);
        await deleteProposals(auction, ctx);
        await auction.destroy();
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
}

async function handleProposalRejection(response, ctx) {
    const proposal = await ctx.orm.Proposal.findOne({
        where: { proposalId: response.proposalId },
    });

    if (proposal) {
        const flight = await findFlight(proposal, ctx);
        const updatedBooked = flight.booked + proposal.quantity;
        await flight.update({ booked: updatedBooked });
        await proposal.destroy();
    }
}

router.post('proposals.handleResponse', '/handleResponse', isAdmin, async (ctx) => {
    try {
        const response = ctx.request.body;
        const auction = await ctx.orm.Auction.findOne({
            where: { auctionId: response.auctionId },
        });
        if (!auction) {
            ctx.body = { error: 'Auction not found' };
            ctx.status = 404;
            return;
        }
        
        if (response.type === 'acceptance') {
            await handleProposalAcceptance(response, auction, ctx);
        } else if (response.type === 'rejection') {
            await handleProposalRejection(response, ctx);
        }

        ctx.body = response;
        ctx.status = 200;
    } catch (error) {
        ctx.body = { error: error.message };
        ctx.status = 400;
    }
});

module.exports = router;