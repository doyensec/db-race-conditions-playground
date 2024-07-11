package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

type PgDb struct {
	databaseUrl string
	isolation   pgx.TxIsoLevel
}

func (self *PgDb) init(isolation string) {
	if isolation == "0" {
		self.isolation = pgx.ReadUncommitted
	} else if isolation == "1" {
		self.isolation = pgx.ReadCommitted
	} else if isolation == "2" {
		self.isolation = pgx.RepeatableRead
	} else if isolation == "3" {
		self.isolation = pgx.Serializable
	} else {
		panic("unknown isolation level")
	}

	self.databaseUrl = "postgres://postgres:postgres@localhost:5432/test001"
}

func (self *PgDb) transfer(request string, source int, destination int, amount int) error {
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, self.databaseUrl)
	if err != nil {
		return errors.New("unable to connect to db")
	}
	defer conn.Close(ctx)

	tx, err := conn.BeginTx(ctx, pgx.TxOptions{IsoLevel: self.isolation})
	if err != nil {
		return errors.New("error creating tx")
	}

	var user User
	err = conn.QueryRow(ctx, "SELECT id, name, balance FROM users WHERE id = $1", source).Scan(&user.Id, &user.Name, &user.Balance)
	if err != nil {
		return fmt.Errorf("read error: %v", err)
	}

	if user.Balance < amount {
		tx.Rollback(ctx)
		return fmt.Errorf("invalid balance")
	}

	fmt.Printf("processing withdraw %v for user => %v with balance => %v\n", request, user.Name, user.Balance)

	_, err = conn.Exec(ctx, "UPDATE users SET balance = balance - $2 WHERE id = $1", source, amount)
	if err != nil {
		return fmt.Errorf("update error: %v", err)
	}

	_, err = conn.Exec(ctx, "UPDATE users SET balance = balance + $2 WHERE id = $1", destination, amount)
	if err != nil {
		return fmt.Errorf("update error: %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return fmt.Errorf("error committing tx")
	}
	return nil
}

func (self *PgDb) dump() ([]User, error) {
	conn, err := pgx.Connect(context.Background(), self.databaseUrl)
	if err != nil {
		return nil, errors.New("unable to connect to db")
	}
	defer conn.Close(context.Background())

	rows, err := conn.Query(context.Background(), "SELECT id, name, balance FROM users")
	if err != nil {
		return nil, errors.New(fmt.Sprintf("read error: %v\n", err))
	}

	var users []User
	for rows.Next() {
		var user User
		err = rows.Scan(&user.Id, &user.Name, &user.Balance)
		if err != nil {
			return nil, errors.New(fmt.Sprintf("scan error: %v\n", err))
		}
		users = append(users, user)
	}
	return users, nil
}

func (self *PgDb) reset() error {
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, self.databaseUrl)
	if err != nil {
		return errors.New("unable to connect to db")
	}
	defer conn.Close(ctx)

	tx, err := conn.Begin(ctx)
	if err != nil {
		return errors.New("error creating tx")
	}

	_, _ = conn.Exec(ctx, "UPDATE users SET balance = 100 WHERE id = 1")
	_, _ = conn.Exec(ctx, "UPDATE users SET balance = 20 WHERE id = 2")

	err = tx.Commit(ctx)
	if err != nil {
		return errors.New("error committing tx")
	}
	return nil
}
