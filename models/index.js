const { Sequelize } = require('sequelize');

const config = require('../configs');

const { database, host, password, username, port } = config.db.mariadb;

const sequelize = new Sequelize(database, username, password, {
    host: host,
    port: port,
    dialect: 'mariadb'
});

const ExpenseEntries = require("./ExpenseEntries");
const ExpenseTypes = require("./ExpenseTypes");
const ExpenseEntryToTypeMap = require("./ExpenseEntryToTypeMap");

const expenseEntries = sequelize.define('ExpenseEntries', ExpenseEntries);
const expenseTypes = sequelize.define('ExpenseTypes', ExpenseTypes);
const expenseEntryToTypeMap = sequelize.define(
    'ExpenseEntryToTypeMap', ExpenseEntryToTypeMap);

expenseTypes.hasOne(expenseTypes, {
    foreignKey: 'parent'
});
// Establish Many-to-Many for ExpenseEntries -> ExpenseTypes
expenseTypes.belongsToMany(expenseEntries, { through: expenseEntryToTypeMap });
expenseEntries.belongsToMany(expenseTypes, { through: expenseEntryToTypeMap });


sequelize.authenticate()
    .then(d => {
        console.log('Connection has been established successfully.');
        return sequelize.sync({ alter: !true });
    })
    .then(d => {
        console.log("All models synced");
    })
    .catch(e => {
        console.error('Unable to connect to the database:', e);
        // throw new Error("Database connection unsuccessful");
    });

module.exports = {
    sequelize,
    expenseEntries,
    expenseTypes,
    expenseEntryToTypeMap
};
