import {Server} from "socket.io"
import http from "http"
import sharedSession from "express-socket.io-session"
import dotenv from "dotenv"
import sessionMiddleware from "./middlewares/pgsession.js"
import app from "./express.js"
import pool from "./db/db.js"
dotenv.config()
const server = http.createServer(app)
const io = new Server(server)
// share the session with socket.io
io.use(sharedSession(sessionMiddleware,{
    autoSave : true
}))

let activeUsers = new Map()
io.on('connection', async(socket)=>{
    const session = socket.handshake.session;

    if(!session.userId){
        console.log('unauthenticated user attempted socket connection')
        return socket.disconnect()
    }

    let user = await pool.query('SELECT * FROM users where id = $1', [session.userId])
    const loggedInUser = user.rows[0]
    console.log(loggedInUser.firstname , ' connected')
    let user_info = {
        username : loggedInUser.firstname,
        id : loggedInUser.id,
        user_profile : loggedInUser.profilepicture
    }

    //  save the socket of logged in users into their id
        activeUsers.set(loggedInUser.id, socket.id)
        console.log('active users ', activeUsers)
    // creating a room 
    const userRoom = `chatRoom`
    // tells the socket to join the connected socket(user )to the userRoom
    socket.join(userRoom)
    // declaring to other users
    socket.to(userRoom).emit('join', `${loggedInUser.firstname} has joined the room`)
    // storing the  connected user info for later use
    socket.data.user = loggedInUser.firstname
    socket.data.room = userRoom

    // one to one chat //
    socket.on('send-private-message', (sentData)=>{
        const reciepientSocketId = activeUsers.get(sentData.userid)
        const messageDetails = {
            message : sentData.message,
            from : loggedInUser.firstname,
        }
        socket.to(reciepientSocketId).emit('received_private-message',messageDetails)
    })
    // ***8********************
//   on sending message
    socket.on('send massage', (msg)=>{
        const senderInfo = {
            senderId : loggedInUser.id,
            sender : loggedInUser.firstname,
            msg : msg,
        }
        socket.broadcast.emit('receive message', senderInfo)
    })

//  typing user
    socket.on('typing', data =>{
        socket.broadcast.emit('typing', data)
    })

    // stop typing
    socket.on('stop typing', data =>{
        console.log(data)
        socket.to(userRoom).emit('hide typing', data)
    })

    socket.on('disconnect', () =>{
        console.log(socket.data.user, ' disconnected')
        socket.to(userRoom).emit('user-disconnect', loggedInUser.firstname)
    })

    // private message events
})

const port = process.env.PORT || 3000
server.listen(port, ()=> console.log('connected'))