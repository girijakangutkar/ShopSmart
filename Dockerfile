FROM node:20

# Install Redis via OS package manager
RUN apt-get update && apt-get install -y redis-server

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# CMD ["sh", "-c", "redis-server --daemonize no & npm start"]
CMD ["sh", "-c", "redis-server & npm start"]
