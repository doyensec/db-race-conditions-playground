.PHONY: build-pg run-pg stop-pg build-mysql run-mysql stop-mysql build-maria run-maria stop-maria build-go run-go build-node run-node

build-pg:
	cd db/pg && docker build -t db-pg .
run-pg:
	docker run -d -p 5432:5432 -t db-pg
stop-pg:
	docker ps -q --filter ancestor=db-pg | xargs docker stop

build-mysql:
	cd db/mysql && docker build -t db-mysql .
run-mysql:
	docker run -d -p 3306:3306 -t db-mysql
stop-mysql:
	docker ps -q --filter ancestor=db-mysql | xargs docker stop

build-maria:
	cd db/maria && docker build -t db-maria .
run-maria:
	docker run -d -p 3306:3306 -t db-maria
stop-maria:
	docker ps -q --filter ancestor=db-maria | xargs docker stop

build-go:
	cd go-app && go get
run-go:
	cd go-app && go run .

build-node:
	cd node-app && npm install
run-node:
	cd node-app && node index.js