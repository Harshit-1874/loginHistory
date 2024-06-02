const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const User = require("./user.model");
const app = express();

require("dotenv").config();

app.set("view engine", "ejs");

// Session middleware
app.use(session({
  secret: "harry1084",
  resave: false,
  saveUninitialized: true
}));

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

mongoose.connect(
  process.env.DB_URI
).then(()=> console.log("Mongo DB connected"));

app.get('/', (req, res) => {

      res.render('home', { userId: req.session.userId });

  });

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
    const { userName, password } = req.body;
    try {
      const user = await User.findOne({ userName, password });
      if (!user) {
        res.status(401).send("Invalid credentials");
      } else {
        req.session.userId = user._id;
        const onlyDate = new Date().toLocaleDateString();
        const onlyTime = new Date().toLocaleTimeString();
        const dateTime = `${onlyDate} ${onlyTime}`;
        const userAgent = req.headers["user-agent"];
        user.loginHistory.push({ dateTime, userAgent });
        await user.save();
        res.redirect("/history");
      }
    } catch (err) {
      res.status(500).send("Error during login: " + err.message);
    }
  });
  
  

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
    const { userName, password, email } = req.body;
    const user = new User({ userName, password, email });
    try {
      await user.save();
      res.redirect("/login");
    } catch (err) {
      res.status(500).send("Error creating user: " + err.message);
    }
  });
  
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/history", async (req, res) => {
    try {
      if (!req.session.userId) {
        res.redirect("/login");
      } else {
        const user = await User.findById(req.session.userId);
        if (!user) {
          res.status(401).send("Invalid user");
        } else {
            console.log(user.loginHistory);
          res.render("history", { history: user.loginHistory });
        }
      }
    } catch (err) {
      res.status(500).send("Error fetching user history: " + err.message);
    }
  });
  

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
