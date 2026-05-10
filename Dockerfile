FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
ENV SESSIONS_DIR=/app/sessions
RUN mkdir -p /app/sessions
CMD ["node", "scripts/render-start.js"]
