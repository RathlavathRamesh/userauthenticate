const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Rigister API ..
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectQuary = ` SELECT * FROM user WHERE username='${username}'`;
  const user = await db.get(selectQuary);
  if (user !== undefined) {
    response.status = 400;
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status = 400;
    response.send("Password is too short'");
  } else {
    const createUser = ` 
      INSERT INTO 
           user(username,name,hashedPassword,gender,location)
           VALUES( 
               '${username}','${name}','${hashedPassword}','${gender}','${location}'
           );
      `;
    const dbResponse = await db.run(createUser);
    response.status = 200;
    response.send("User created successfully");
  }
});

//API2

app.get("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectplayer = ` SELECT * FROM user WHERE username='${username}';
    `;
  const dbuser = await db.get(selectplayer);
  if (dbuser === undefined) {
    response.status = 400;
    response.send("Invalid User");
  } else {
    const iscorrectpassword = await bcrypt.compare(password, dbuser.password);
    if (iscorrectpassword) {
      response.status = 200;
      response.send("Login Success!");
    } else {
      (response.status = 400), response.send("Invalid User!");
    }
  }
});
//Change Password API
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectquary = `SELECT * FROM user WHERE username='${username}'`;
  const dbuser = await db.get(selectquary);
  if (dbuser === undefined) {
    response.status = 400;
    response.send("Invalid User");
  } else if (await bcrypt.compare(oldPassword, dbuser.password)) {
    if (newPassword.length() < 5) {
      response.status = 400;
      response.send("Password is too Short");
    } else {
      const hasspassword = await bcrypt.hash(newPassword, 10);
      const ubdateQuary = ` 
         UPDATE 
         user 
         SET 
         password='${hasspassword}';
      `;
      await db.run(ubdateQuary);
      response.status = 200;
      response.send("Password updated");
    }
  }
});

module.exports = app;
