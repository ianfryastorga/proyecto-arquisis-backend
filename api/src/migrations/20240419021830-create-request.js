/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      requestId: {
        type: Sequelize.UUID,
      },
      groupId: {
        type: Sequelize.STRING,
      },
      departureAirport: {
        type: Sequelize.STRING,
      },
      arrivalAirport: {
        type: Sequelize.STRING,
      },
      departureTime: {
        type: Sequelize.DATE,
      },
      datetime: {
        type: Sequelize.STRING,
      },
      depositToken: {
        type: Sequelize.STRING,
      },
      quantity: {
        type: Sequelize.INTEGER,
      },
      seller: {
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Requests');
  },
};
