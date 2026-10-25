FROM ampathke/etl-services:base

WORKDIR /opt/etl

# Remove copied configurations
RUN rm -rf /opt/etl/conf
COPY . /opt/etl/

# Install new added dependencies
# --legacy-peer-deps is required: hapi-swagger@4 declares peer deps on hapi 9-13
# while this project uses hapi 16 (npm >= 7 fails with ERESOLVE otherwise).
# Note: the dependency tree (axios 1.x, ioredis 5.x, express 4.22) requires
# the base image to provide Node.js >= 18.
RUN npm install --legacy-peer-deps
CMD ["pm2-docker", "start", "/opt/etl/pm2.json" ]
