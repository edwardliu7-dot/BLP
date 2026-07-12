FROM node:20-slim

# Coolify's healthcheck runs curl/wget inside the container; node:20-slim
# doesn't include either by default, which makes Coolify think a perfectly
# running app is unhealthy and roll the deployment back.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

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

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
    CMD curl -f http://localhost:5000/ || exit 1

CMD ["npm", "run", "start"]
