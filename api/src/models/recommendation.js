'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Recommendation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Flight, {
        foreignKey: 'flightId',
        as: 'flight'
      });
    }
  }
  Recommendation.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    flightId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Recommendation',
  });
  return Recommendation;
};