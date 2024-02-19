var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const mysql2 = require('mysql2/promise');
// var dotenv = require ("dotenv")

require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

  app.get("/api/test", function (req, res, next) {
    console.log("test");
    res.json({ message: "test" });
  });

  app.post("/api/checkout", express.json(), async (req, res) => {
    try {
        // create payment session
        const { user, product } = req.body;
        if (!user || !product || !user.name || !user.address || !product.name || !product.price || !product.quantity) {
            return res.status(400).json({ error: "Invalid user or product data" });
        }

        const orderId = uuidv4();
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "thb",
                        product_data: {
                            name: product.name,
                        },
                        unit_amount: product.price * 100,
                    },
                    quantity: product.quantity,
                },
            ],
            mode: "payment",
            success_url: `http://localhost:8888/success.html?id=${orderId}`,
            cancel_url: `http://localhost:8888/cancel.html?id=${orderId}`,
        });

        // create order in database (name, address, session id, status)
        console.log("session", session);

        const data = {
            fullname: user.name,
            address: user.address,
            session_id: session.id,
            status: session.status,
            order_id: orderId,
        };
        const connection = await mysql2.createConnection({
          host: 'localhost',
          user: 'root',
          database: 'test'
      });

        const [result] = await connection.query("INSERT INTO orders SET ?", data);
        res.json({
            user,
            product,
            order: result,
        });
    } catch (error) {
        console.error("Error creating order:", error.message);
        res.status(400).json({ error: "Error creating order" });
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
