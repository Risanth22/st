FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "src/index.js"]
