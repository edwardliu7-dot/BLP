FROM node:20-slim

WORKDIR /app

COPY package*.json .npmrc ./
# node:20-slim ships npm 10.8.2, which has a known bug ("Exit handler never
# called!") that can make `npm ci` silently exit 0 without finishing the
# install. Upgrade npm first, then verify the install actually produced a
# working node_modules before continuing, so failures are loud instead of
# surfacing later as a confusing "vite: not found" in the build step.
RUN npm install -g npm@11 \
    && npm ci \
    && test -x node_modules/.bin/vite || (echo "npm ci did not install dependencies correctly" && exit 1)

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "run", "start"]
