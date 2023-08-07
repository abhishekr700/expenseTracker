const { DataTypes } = require('sequelize');

const ExpenseTypes = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    parent: {
        type: DataTypes.INTEGER
    }
};

module.exports = ExpenseTypes;
