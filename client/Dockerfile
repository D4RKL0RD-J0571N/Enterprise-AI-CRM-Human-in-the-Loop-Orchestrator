FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Expose host to allow external access (important for Docker)
CMD ["npm", "run", "dev", "--", "--host"]
