package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

type MariaDb struct {
	db        *sql.DB
	isolation sql.IsolationLevel
}

func (self *MariaDb) init(isolation string) {
	if isolation == "0" {
		self.isolation = sql.LevelReadUncommitted
	} else if isolation == "1" {
		self.isolation = sql.LevelReadCommitted
	} else if isolation == "2" {
		self.isolation = sql.LevelRepeatableRead
	} else if isolation == "3" {
		self.isolation = sql.LevelSerializable
	} else {
		panic("unknown isolation level")
	}

	db, err := sql.Open("mysql", "root:password@tcp(localhost:3306)/test001")
	if err != nil {
		panic(err)
	}
	self.db = db
}

func (self *MariaDb) transfer(request string, source int, destination int, amount int) error {
	opts := sql.TxOptions{
		Isolation: self.isolation,
		ReadOnly:  false,
	}
	tx, err := self.db.BeginTx(context.Background(), &opts)
	if err != nil {
		return errors.New("error creating tx")
	}

	var user User
	err = tx.QueryRow("SELECT id, name, balance FROM users WHERE id = ?", source).Scan(&user.Id, &user.Name, &user.Balance)
	if err != nil {
		return fmt.Errorf("read error: %v", err)
	}

	if user.Balance < amount {
		tx.Rollback()
		return fmt.Errorf("invalid balance")
	}

	fmt.Printf("processing withdraw %v for user => %v with balance => %v\n", request, user.Name, user.Balance)

	_, err = tx.Exec("UPDATE users SET balance = balance - ? WHERE id = ?", amount, source)
	if err != nil {
		return fmt.Errorf("update error: %v", err)
	}

	_, err = tx.Exec("UPDATE users SET balance = balance + ? WHERE id = ?", amount, destination)
	if err != nil {
		return fmt.Errorf("update error: %v", err)
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("error committing tx")
	}
	return nil
}

func (self *MariaDb) dump() ([]User, error) {
	rows, err := self.db.Query("SELECT id, name, balance FROM users")
	if err != nil {
		return nil, errors.New("read failed")
	}
	defer rows.Close()

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

func (self *MariaDb) reset() error {
	tx, err := self.db.Begin()
	if err != nil {
		return errors.New("error creating tx")
	}

	_, _ = tx.Exec("UPDATE users SET balance = 100 WHERE id = 1")
	_, _ = tx.Exec("UPDATE users SET balance = 20 WHERE id = 2")

	err = tx.Commit()
	if err != nil {
		return errors.New("error committing tx")
	}
	return nil
}
