# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy project files
COPY . .

# Build the app (this generates the .next folder)
RUN npm run build


# Stage 2: Run the app
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed for production
COPY --from=builder /app/package*.json ./ 
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# ✅ Optional safety: ensure .next actually exists
RUN ls -la .next || (echo "❌ .next folder missing!" && exit 1)

# Sevalla uses an environment-injected PORT
EXPOSE 3000

# Run the Next.js production server
CMD ["npm", "run", "start", "--", "-p", "${PORT:-3000}"]

