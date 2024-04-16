'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Flight extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Flight.init({
    departureAirportName: DataTypes.STRING,
    departureAirportId: DataTypes.STRING,
    departureTime: DataTypes.DATE,
    arrivalAirportName: DataTypes.STRING,
    arrivalAirportId: DataTypes.STRING,
    arrivalTime: DataTypes.DATE,
    duration: DataTypes.INTEGER,
    airplane: DataTypes.STRING,
    airline: DataTypes.STRING,
    airlineLogo: DataTypes.STRING,
    price: DataTypes.INTEGER,
    carbonEmission: DataTypes.INTEGER,
    airlineLogoUrl: DataTypes.STRING,
    currency: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Flight',
  });
  return Flight;
};