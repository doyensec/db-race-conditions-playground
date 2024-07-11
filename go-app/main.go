package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const CTX_REQUEST_ID string = "requestId"

var config Config = Config{
	Auth: false,
}

type Config struct {
	Auth      bool
	Db        string `json:"db"`
	Http2     bool   `json:"http2"`
	Isolation string `json:"isolation"`
}

type User struct {
	Id      int    `json:"id"`
	Name    string `json:"name"`
	Balance int    `json:"balance"`
}

type Db interface {
	init(isolation string)
	dump() ([]User, error)
	reset() error
	transfer(request string, source int, destination int, amount int) error
}

func setupRouter() *gin.Engine {
	dbType := os.Getenv("DB")
	isolation := os.Getenv("ISOLATION")
	if isolation != "0" && isolation != "1" && isolation != "2" && isolation != "3" {
		panic(fmt.Sprintf("unknown isolation level => '%v'", isolation))
	}

	r := gin.Default()

	var db Db
	if dbType == "mysql" {
		db = &MySqlDb{}
	} else if dbType == "maria" {
		db = &MariaDb{}
	} else if dbType == "pg" {
		db = &PgDb{}
	} else {
		panic(fmt.Sprintf("unknown db type => '%v'", dbType))
	}

	config.Db = dbType
	config.Isolation = isolation

	fmt.Printf("[+] db => '%v'\n", dbType)
	fmt.Printf("[+] isolation => '%v'\n", isolation)
	db.init(isolation)

	r.Use(func(c *gin.Context) {
		c.Set(CTX_REQUEST_ID, uuid.New().String())
		c.Next()
	})

	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"pong": 1})
	})

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"pong": 1})
	})

	r.GET("/dump", func(c *gin.Context) {
		users, err := db.dump()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, users)
	})

	r.GET("/config", func(c *gin.Context) {
		c.JSON(http.StatusOK, config)
	})

	r.GET("/reset", func(c *gin.Context) {
		err := db.reset()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		users, err := db.dump()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, users)
	})

	r.POST("/transfer", func(c *gin.Context) {
		var body struct {
			From   int `json:"from"`
			To     int `json:"To"`
			Amount int `json:"amount"`
		}
		_ = c.Bind(&body)

		err := db.transfer(c.GetString(CTX_REQUEST_ID), body.From, body.To, body.Amount)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	return r
}

func main() {
	http2Enabled := os.Getenv("HTTP2")
	fmt.Printf("[+] http2 => '%v'\n", http2Enabled)
	config.Http2 = http2Enabled == "true"
	config.Auth = false

	r := setupRouter()
	if config.Http2 {
		r.RunTLS(":9009", "./cert/server.cert", "./cert/server.key")
	} else {
		r.Run(":9009")
	}
}
