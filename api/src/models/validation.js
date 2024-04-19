const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Validation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Validation.init({
    requestId: DataTypes.STRING,
    groupId: DataTypes.STRING,
    seller: DataTypes.INTEGER,
    valid: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'Validation',
  });
  return Validation;
};
