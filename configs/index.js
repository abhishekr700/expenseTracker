module.exports = {
    db: {
        mariadb: {
            host: process.env.DB_HOST,
            port: process.env.DB_POST,
            database: process.env.DB_NAME,
            username: process.env.DB_USER,
            password: process.env.DB_PASS
        }
    },
    server: {
        port: 4000
    }
};
