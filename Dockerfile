# Set the base image
FROM node:16.14.0

# WORKDIR /usr/src/app/
WORKDIR /home/gateway

# Copy files
COPY . .

# Dockerfile author / maintainer
LABEL maintainer="aura.network"

# Build arguments
LABEL branch=${BRANCH}
LABEL commit=${COMMIT}
LABEL date=${BUILD_DATE}

# Set ENV variables
ENV COMMIT_BRANCH=${BRANCH}
ENV COMMIT_SHA=${COMMIT}
ENV BUILD_DATE=${DATE}
ENV INSTALLATION_TYPE=docker

# Create mount points
RUN mkdir -p /home/gateway/conf /home/gateway/logs /home/gateway/db /home/gateway/certs

# Install dependencies and compile
RUN yarn install --frozen-lockfile
RUN yarn build

# Expose port 15888 - note that docs port is 8080
EXPOSE 15888

# Set the default command to run when starting the container
CMD yarn run start
