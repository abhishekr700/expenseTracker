const { Sequelize } = require('sequelize');

const config = require('../configs');

const { database, host, password, username, port } = config.db.mariadb;

const sequelize = new Sequelize(database, username, password, {
    host: host,
    port: port,
    dialect: 'mariadb',
    logging: console.log
});

const ExpenseEntries = require("./ExpenseEntries");
const ExpenseTypes = require("./ExpenseTypes");
const ExpenseEntryToTypeMap = require("./ExpenseEntryToTypeMap");
const Tags = require("./Tags");

const expenseEntries = sequelize.define('ExpenseEntries', ExpenseEntries);
const expenseTypes = sequelize.define('ExpenseTypes', ExpenseTypes);
const expenseEntryToTypeMap = sequelize.define(
    'ExpenseEntryToTypeMap', ExpenseEntryToTypeMap);
const tags = sequelize.define('Tags', Tags);

expenseTypes.hasOne(expenseTypes, {
    foreignKey: 'parent'
});
// Establish Many-to-Many for ExpenseEntries -> ExpenseTypes
expenseTypes.belongsToMany(expenseEntries, { through: expenseEntryToTypeMap });
expenseEntries.belongsToMany(expenseTypes, { through: expenseEntryToTypeMap });

// Establish Many-to-Many for ExpenseEntries -> Tags
expenseEntries.belongsToMany(tags,
    { through: 'ExpenseTags', onDelete: 'CASCADE' });
tags.belongsToMany(expenseEntries,
    { through: 'ExpenseTags', onDelete: 'CASCADE' });


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
    expenseEntryToTypeMap,
    tags
};
