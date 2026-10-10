FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

RUN mkdir -p uploads/medical-reports
RUN mkdir -p uploads/fitness-certificates

EXPOSE 4000

CMD ["npm", "start"]