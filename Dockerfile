FROM node:16-alpine
WORKDIR /home/node/app
COPY package.json .
COPY yarn.lock .
COPY action.js .
ENV NODE_ENV production
RUN yarn install --prefer-offline --frozen-lockfile --production --unsafe-perm --ignore-optional
ENTRYPOINT ["node", "action.js"]
