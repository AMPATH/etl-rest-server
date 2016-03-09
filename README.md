ETL Rest Server
===============

This is node project using [hapi](http://hapijs.com) to expose rest endpoints providing
access to data hosted in ETL flat tables (the tables themselves are flattened derived tables 
containing data from [OpenMRS](https://openmrs.org/)). There is a separate etl project that 
is responsible for data generation.

Using Docker Compose 1.6+
-------------------------

    docker-compose up -d

Confirm by looking for the server at host port 8002 using TLS:

    curl -k https://docker:8007

Without Docker Compose
----------------------

## Building

    docker build -t etl .

## Running

### Using Docker for MySQL

    docker run -d --name mysql4etl -e MYSQL_ROOT_PASSWORD=supersecret \
      -e MYSQL_USER=etl_user -e MYSQL_PASSWORD=etl_password mysql

    docker run -d --name etl --link mysql4etl:db -p 8002:8002 etl

### Using your own MySQL server

If you have MySQL running at 1.2.3.4 with username "myuser" and password "mypassword":

    docker run -d --name etl \
      -e DB_PORT_3306_TCP_ADDR=1.2.3.4 -e DB_PORT_3306_TCP_PORT=3306 \
      -e MYSQL_USER=myuser -e MYSQL_PASSWORD=mypassword \
      -p 8002:8002 etl

### Using custom SSL certificate

    docker run -d -name etl -v /path/to/keys/:/keys -p 8002:8002 etl

The folder /path/to/keys/ should contain SSL certificate and private key in `server.crt` 
and `server.key`.