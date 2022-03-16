FROM node:16-alpine
WORKDIR /home/node/app
RUN cp package.json .
RUN cp yarn.lock .
RUN cp action.js .
ENV NODE_ENV production
RUN yarn install --prefer-offline --frozen-lockfile --production --unsafe-perm --ignore-optional
CMD ["node", "action.js"]
