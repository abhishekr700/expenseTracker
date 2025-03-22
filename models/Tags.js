const { DataTypes } = require('sequelize');

const Tags = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        set(value) {
            this.setDataValue("name", value.toLowerCase());
        }
    }
};

module.exports = Tags;
