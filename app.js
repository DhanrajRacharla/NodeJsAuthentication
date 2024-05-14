const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
  }
}

initializeDbAndServer()

// user register API

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  //const hashedPassword = await bcrypt.hash(password, 10)

  const checkingUser = `SELECT * FROM user WHERE username = '${username}';`
  const checkingUserResponse = await db.get(checkingUser)

  if (checkingUserResponse !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const createUser = `INSERT INTO user (username, name, password, gender, location)
      VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');
      `
      await db.run(createUser)
      response.status(200)
      response.send('User created successfully')
    }
  }
})

// user login API

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const checkuserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const checkuserQueryResponse = await db.get(checkuserQuery)

  if (checkuserQueryResponse === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(
      password,
      checkuserQueryResponse.password,
    )

    if (isPasswordMatch === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// changing user password

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkingUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const checkingUserQueryResponse = await db.get(checkingUserQuery)

  //console.log(isPasswordMatch)

  if (checkingUserQueryResponse === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      checkingUserQueryResponse.password,
    )
    if (isPasswordMatch === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatePassword = `UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}';`
        await db.run(updatePassword)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
