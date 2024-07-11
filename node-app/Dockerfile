FROM node:19.5.0

ENV ISOLATION=1
ENV DB=maria
ENV HTTP2=false

WORKDIR /app

COPY ./package*.json ./

RUN npm install

COPY . .

EXPOSE 9009

CMD ["node", "index.js"]