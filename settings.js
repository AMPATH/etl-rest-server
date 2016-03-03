module.exports = {
    mysqlPoolSettings: {
        connectionLimit : 10,
        host: process.env.DB_PORT_3306_TCP_ADDR,            //IP or hostname
        port: process.env.DB_PORT_3306_TCP_PORT || '3306',
        user: process.env.DB_ENV_MYSQL_USER || 'etl_user',
        password: process.env.DB_ENV_MYSQL_PASSWORD || 'etl_password'
    },
    sslSettings: {
        key: '/keys/server.key',  // Server Key
        crt: '/keys/server.crt'    // Certificate to allow TLS access to the server
    }
}