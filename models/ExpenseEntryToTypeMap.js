const { Sequelize, DataTypes } = require('sequelize');

const ExpenseEntryToTypeMap = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // expenseEntryId: {
    //     type: DataTypes.INTEGER,
    //     references: {
    //         model: 'ExpenseEntries',
    //         key: 'id'
    //     }
    // },
    // expenseTypeId: {
    //     type: DataTypes.INTEGER,
    //     references: {
    //         model: 'ExpenseTypes',
    //         key: 'id'
    //     }
    // }
};

module.exports = ExpenseEntryToTypeMap;
