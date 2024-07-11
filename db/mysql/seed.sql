CREATE DATABASE test001;

USE test001;

CREATE TABLE users(id INT PRIMARY KEY NOT NULL, name TEXT NOT NULL, balance INT NOT NULL);

INSERT INTO users VALUES (1, 'alice', 100);
INSERT INTO users VALUES (2, 'bob', 20);

-- user setup

CREATE USER 'racer'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
GRANT ALL PRIVILEGES ON test001.* TO 'racer'@'%';