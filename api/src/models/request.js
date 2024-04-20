const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Request extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Request.init({
    requestId: DataTypes.UUID,
    groupId: DataTypes.STRING,
    departureAirport: DataTypes.STRING,
    arrivalAirport: DataTypes.STRING,
    departureTime: DataTypes.DATE,
    datetime: DataTypes.STRING,
    depositToken: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    seller: DataTypes.INTEGER,
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
  }, {
    sequelize,
    modelName: 'Request',
  });
  return Request;
};
