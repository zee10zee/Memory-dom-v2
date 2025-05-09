import express from "express"
import pool from "../db/db.js"
import pgSession from "connect-pg-simple"
import session from "express-session"


// session setup
const pgStore = pgSession(session) // stores session in db/ class session
const sessionMiddleware = session({
    store :  new pgStore({
      pool : pool,
      tableName : 'session',
      createTableIfMissing : true
    }),
    secret : 'secretKey',
    resave : false,
    saveUninitialized : true,
    cookie: {
        httpOnly: true,
        secure: false,  // Ensure you're using HTTPS
        sameSite: 'Strict',  // 'Strict' prevents cross-site cookie sharing
        maxAge: 1000 * 60 * 60 // Example: session expires in 1 hour
      }
})


export default sessionMiddleware