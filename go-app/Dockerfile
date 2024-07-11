FROM golang:1.19-buster

ENV ISOLATION=1
ENV DB=maria
ENV HTTP2=false

WORKDIR /app

COPY go.* ./

RUN go mod download

COPY . .

RUN go build -v -o server

EXPOSE 9009

CMD ["/app/server"]