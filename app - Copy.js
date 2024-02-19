var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var jwt = require("jsonwebtoken");

async function init() {
  var app = express();
  app.use(cors());
  app.use(bodyParser.json());
  // res.end(JSON.stringify(req.body, null, 2))
  port = 4008;
  const mysql = require("mysql2");
  const bcrypt = require("bcrypt");
  const saltRounds = 10;
  const secret = "FullStack-Login-2024";

  // var token = jwt.sign({ foo: "bar" }, "shhhhh");

  const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test",
  });

  app.post("/register", jsonParser, function (req, res, next) {
    //OK req.body test
    // var username = req.body.username
    // var email = req.body.email
    // var password = req.body.password
    // res.json({username,email,password})
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      // Store hash in your password DB.
      connection.execute(
        "INSERT INTO users (username,email,password) VALUES(?,?,?)",
        [req.body.username, req.body.email, hash],
        function (err, results, fields) {
          if (err) {
            res.json({ status: "error", message: err });
            return;
          }
          console.log("results :", results);
          console.log("fields :", fields);
          res.json({ status: "send OK, Register successfully" });
        }
      );
    });
  });

  app.post("/login", jsonParser, function (req, res, next) {
    connection.execute(
      "SELECT * FROM users WHERE email=?",
      [req.body.email],
      function (err, users, fields) {
        console.log("users login :", users);
        console.log("fields login :", fields);

        if (err) {
          res.json({ status: "error", message: err });
          return;
        }
        if (users.length == 0) {
          res.json({ status: "error", message: "no user found" });
          return;
        }
        bcrypt.compare(
          req.body.password,
          users[0].password,
          function (err, isLogin) {
            if (isLogin) {
              // var token = jwt.sign({ foo: 'bar' }, 'shhhhh');//default
              var token = jwt.sign({ email: users[0].email }, secret, {
                expiresIn: "1h",
              });
              res.json({
                status: "OK",
                message: "login successfully",
                token,
              });
              console.log("login status: success");
            } else {
              res.json({ status: "error", message: "login failed" });
              console.log("login status: failed");
            }
          }
        );
      }
    );
  });

  app.post("/authen", jsonParser, function (req, res, next) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      var decoded = jwt.verify(token, secret);
      res.json({ status: "OK", decoded });
    } catch (err) {
      res.json({ status: "error", message: err.message });
    }
  });


  

  app.get("/", function (req, res, next) {
    res.json({ msg: "Hello Full Stack Developer" });
  });

  app.get("*", function (req, res, next) {
    res.json({ msg: "Please check api root" });
  });

  app.listen(port, function () {
    console.log(`Web Server is listening on port ${port}`);
  });
}
init();
