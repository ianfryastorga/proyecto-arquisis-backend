'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('Auctions', 'auctionId', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('Auctions', 'proposalId', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('Proposals', 'auctionId', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('Proposals', 'proposalId', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn('Auctions', 'auctionId', {
      type: Sequelize.UUID,
      allowNull: false,
    });
    await queryInterface.changeColumn('Auctions', 'proposalId', {
      type: Sequelize.UUID,
      allowNull: false,
    });
    await queryInterface.changeColumn('Proposals', 'auctionId', {
      type: Sequelize.UUID,
      allowNull: false,
    });
    await queryInterface.changeColumn('Proposals', 'proposalId', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  }
};
