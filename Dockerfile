# Chain-role indexer worker for Railway (Node 22). Next.js app deploys on Vercel.
# Railway runs `docker build` when this file exists at the repo root — faster than
# relying on config-as-code alone.
#
# Vercel’s default Next.js build ignores this file unless you explicitly switch the
# project to a Docker deployment.
FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
CMD ["yarn", "indexer"]
