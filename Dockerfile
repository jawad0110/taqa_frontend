# Stage 1: Build the Next.js app
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy project files
COPY . .

# Build Next.js app
RUN npm run build

# Stage 2: Run the app
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built output and only needed files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose Sevalla's injected PORT (default 3000)
EXPOSE 3000

# Start Next.js
CMD ["npm", "run", "start", "--", "-p", "${PORT:-3000}"]
