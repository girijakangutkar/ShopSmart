FROM node:19

# Install Redis
RUN apt-get update && apt-get install -y redis-server

# Install tini
RUN npm install -g tini

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Start Redis and Node app
# CMD redis-server & npm start

CMD ["sh", "-c", "redis-server & npm start"]