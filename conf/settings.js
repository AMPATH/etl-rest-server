module.exports = {
    mysqlPoolSettings: {
        connectionLimit : 10,
        host: '10.50.80.75',
        port: '3306',
        user: 'etl1',
        password: 'etl123',
        multipleStatements:true
    },
    sslSettings: {
        key:'conf/server.key',
        crt:'conf/server.crt'
    }
}


 //module.exports = {
 //    mysqlPoolSettings: {
 //        connectionLimit : 10,
 //        host: 'localhost',
 //        port: '3306',
 //        user: 'root',
 //        password: 'toor'
 //    },
 //    sslSettings: {
 //        key:'conf/server.key',
 //        crt:'conf/server.crt'
 //    }
 //}

//module.exports = {
//    mysqlPoolSettings: {
//        connectionLimit : 10,
//        host: '10.50.80.58',
//        port: '3306',
//        user: 'etl_user',
//        password: 'EeK6FEuxS7Y8IBiV'
//    },
//    sslSettings: {
//        key:'conf/server.key',
//        crt:'conf/server.crt'
//    }
//}
