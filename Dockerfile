FROM node:12.18.3-slim
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/app
COPY ./package*.json ./
RUN npm install --only=production
COPY . .

CMD ["node", "--max_old_space_size=512", "./src/index.js"]
