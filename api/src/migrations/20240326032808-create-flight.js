/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Flights', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      departureAirportName: {
        type: Sequelize.STRING,
      },
      departureAirportId: {
        type: Sequelize.STRING,
      },
      departureTime: {
        type: Sequelize.DATE,
      },
      arrivalAirportName: {
        type: Sequelize.STRING,
      },
      arrivalAirportId: {
        type: Sequelize.STRING,
      },
      arrivalTime: {
        type: Sequelize.DATE,
      },
      duration: {
        type: Sequelize.INTEGER,
      },
      airplane: {
        type: Sequelize.STRING,
      },
      airline: {
        type: Sequelize.STRING,
      },
      airlineLogo: {
        type: Sequelize.STRING,
      },
      price: {
        type: Sequelize.INTEGER,
      },
      carbonEmission: {
        type: Sequelize.INTEGER,
      },
      airlineLogoUrl: {
        type: Sequelize.STRING,
      },
      currency: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('Flights');
  },
};
