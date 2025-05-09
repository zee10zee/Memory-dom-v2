import {Server} from "socket.io"
import e, { urlencoded } from "express"
import path from "path"
import session from "express-session"
import methodOverride from "method-override"
import http from "http"
import sharedSession from "express-socket.io-session"
import dotenv from "dotenv"
import upload from "./middlewares/multer.js/multer.js"
import pool from "./db/db.js"
import sessionMiddleware from "./middlewares/pgsession.js"
import { validate, authenticate } from "./middlewares/validationAndAuthenticate.js"
import { loggedInUsers } from "./middlewares/validationAndAuthenticate.js"
// routes
import postsRoute from "./routes/posts.js"
import usersRoute from "./routes/users-Auth.js"
import chatRoutes from "./routes/chatRoutes.js"

const app = e()
 app.use(sessionMiddleware);
app.use(e.urlencoded({extended : true}))
app.use(e.static('public'))
app.use('/uploads',e.static(path.resolve('public/uploads')));
app.use(methodOverride('_method'));

app.use(validate)
app.use('/', postsRoute)
app.use('/', usersRoute)
app.use('/', chatRoutes)

// multer config

app.get('/', async(req,res)=>{
    const postsAndUsers = await pool.query('SELECT posts.* , users.firstname AS author, users.email FROM posts LEFT JOIN users ON posts.userid = users.id')
    const posts = postsAndUsers.rows
    const activeBuddies = Array.from(loggedInUsers.values())
    const filteredLoggedInUsers = activeBuddies.filter((user) => user.id !== req.session.userId)
    console.log(filteredLoggedInUsers.length)
    res.render('index.ejs', {posts: posts, activeUsers : filteredLoggedInUsers})
});


export default app;
