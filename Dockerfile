FROM ubuntu:14.04

COPY . /opt/etl

RUN apt-get update && \
  apt-get install -y git openssl nodejs npm && \
  ln -s /usr/bin/nodejs /usr/bin/node && \
  sed -i -- 's/localhost/0.0.0.0/g' /opt/etl/etl-server.js && \
  if [ ! -f /keys/server.crt ]; then \
    mkdir /keys; \
    openssl req -nodes -new -x509 -keyout /keys/server.key -out /keys/server.crt \
      -subj "/C=US/ST=Denial/L=Springfield/O=ACME/CN=*"; \
  fi && \
  cd /opt/etl && \
  npm install

COPY settings.js /opt/etl/conf/settings.js

EXPOSE 8002

CMD ["/usr/bin/node", "/opt/etl/etl-server.js"]