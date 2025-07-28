FROM mcr.microsoft.com/playwright:v1.42.1-jammy

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# ✅ Installe les navigateurs nécessaires à Playwright
RUN npx playwright install --with-deps

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
