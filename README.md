# Database Race Conditions - Playground

This is a companion repository to the [A Race to the Bottom](https://blog.doyensec.com/2024/07/11/database-race-conditions.html) blog post. It contains sample apps and database Docker images to help you set up a playground an experiment with database transactions and concurrency control.

## 1. Building Database Images

Build a Postgres image:
```bash
# build image
make build-pg

# run image
make run-pg

# stop image
make stop-pg
```

Build a MySQL image:
```bash
# build image
make build-mysql

# run image
make run-mysql

# stop image
make stop-mysql
```

Build a Maria image:
```bash
# build image
make build-maria

# run image
make run-maria

# stop image
make stop-maria
```

## 2. Set up your Environment

The environment can be set using the `.env` file:
```bash
DB="pg|mysql|maria"
HTTP2="true|false"
ISOLATION="0|1|2|3"
```

The isolation levels map in the following way:
- 0 => `Read Uncommitted`
- 1 => `Read Committed`
- 2 => `Repeatable Read`
- 3 => `Serializable`

The environment can be then be sourced to your environment using:
```bash
export $(cat .env| xargs)
```

## 3. Run the Application

Build and run the Go application with:
```bash
# build
make build-go

# run 
make run-go
```

Build and run the Node application with:
```bash
# build
make build-node

# run 
make run-node
```