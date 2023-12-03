const { DataTypes } = require('sequelize');

const ExpenseEntries = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // userid: {
    //     type: DataTypes.INTEGER,
    //     references: {
    //         model: 'ExpenseEntries',
    //         key: 'id'
    //     }
    // },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    splitwiseExpenseId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
};

module.exports = ExpenseEntries;
