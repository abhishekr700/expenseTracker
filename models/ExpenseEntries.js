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
        type: DataTypes.BIGINT,
        allowNull: true
    },
    upiReferenceNum: {
        type: DataTypes.STRING,
        allowNull: true
    },
    externalUniqueId: {
        type: DataTypes.STRING,
        allowNull: true
    }
};

module.exports = ExpenseEntries;
