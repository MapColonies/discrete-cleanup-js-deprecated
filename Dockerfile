FROM node:12.18.3-slim
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/app

# RUN chgrp -R 0 /usr/app && \
#     chmod -R g=u /usr/app

RUN useradd -ms /bin/bash user && \
    usermod -a -G root user

COPY ./package*.json ./
RUN npm install --only=production
COPY . .

USER user
CMD ["node", "--max_old_space_size=512", "./src/index.js"]
