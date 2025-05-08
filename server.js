import {Server} from "socket.io"
import e, { urlencoded } from "express"
import pkg from "pg"
import multer, { diskStorage } from "multer"
import path from "path"
import session from "express-session"
import pgSession from "connect-pg-simple"
import methodOverride from "method-override"
import http from "http"
import sharedSession from "express-socket.io-session"



const app = e()

const server = http.createServer(app)
const io = new Server(server)

 const {Pool} = pkg;
 const pool = new Pool({
    user : process.env.USERNAME||'postgres',
    host : process.env.HOST||'localhost',
    database : process.env.DATABASE || 'neverGiveUp',
    password : process.env.PASSWORD || 'Zohrajan10@',
    port : process.env.PORT || 5432
 });

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
    cookie : {
        secure : false 
    }
})
 app.use(sessionMiddleware);

// share the session with socket.io
io.use(sharedSession(sessionMiddleware,{
    autoSave : true
}))

io.on('connection', async(socket)=>{
    console.log(socket.id, ' connected ')
    const session = socket.handshake.session;

    if(!session.userId){
        console.log('unauthenticated user attempted socket connection')
        return socket.disconnect()
    }

    const user = await pool.query('SELECT * FROM users where id = $1', [session.userId])

    const loggedInUser = user.rows[0]

    socket.on('send message', (msg)=>{
        const messageData = {
            userid : loggedInUser.id,
            username : loggedInUser.firstname,
            text : msg,
            massage_sent_at : Date.now()
        }
        
        io.emit('send message', messageData)
    })

    console.log('user connected via socket to session. active user id: ', session.userId)

})


const storage = diskStorage({
    destination : (req,file,cb)=>{
        cb(null, 'public/uploads')
    },
    filename : (req,file,cb)=>{
        const customName = Date.now()
        cb(null, customName + "-" + file.originalname)
    }
});

const upload = multer({storage : storage})
app.use(e.urlencoded({extended : true}))
app.use(e.static('public'))
app.use('/uploads',e.static(path.resolve('public/uploads')));
app.use(methodOverride('_method'));

async function validate(req,res,next){
    if(req.session.userId){
        const loggedInUser = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId])
        const user = loggedInUser.rows[0]
        res.locals.loggedinUser = user;
    }else{
         console.log('no session')
    }
    next()
};

app.use(validate)



// multer config

app.get('/', async(req,res)=>{
    const postsAndUsers = await pool.query('SELECT posts.* , users.firstname AS author, users.email FROM posts LEFT JOIN users ON posts.userid = users.id')
    const posts = postsAndUsers.rows
        res.render('index.ejs', {posts: posts})
});

app.get('/signUp', (req,res)=>{
    res.render('signup.ejs')
})

app.get('/login', (req,res)=>{
        res.render('login.ejs')
})

app.post('/login', async(req,res)=>{
    const {firstname, email} = req.body
   try{
     // if user exists in db with these credentials // CHECK DB NOT session
     const foundUser = await pool.query('SELECT * FROM users WHERE firstname = $1 AND email = $2;',[firstname, email])

     if(foundUser.rows.length > 0){
         const user = foundUser.rows[0]
         req.session.userId = user.id
         console.log('welcome back ', user)
         res.redirect('/')
     }else{
         return res.send('please sign up first')
     }
   }catch(err){console.error(err)}
})


app.post('/signup', upload.single('userImage'),async(req,res)=>{
   const body = {
     fname : req.body.firstname,
     email : req.body.email,
   }

     try{
        const user = await pool.query('SELECT * FROM users WHERE firstname = $1 AND email = $2', [body.fname, body.email]);

     if(user.rows.length > 0){
       return res.send('this account already exists ! please log in ! ')
     }

     const profilepicture = req.file? path.join('uploads/', req.file.filename): user.rows[0].postimage

     const newUser = await pool.query('INSERT INTO users (firstname, email) VALUES(LOWER($1), LOWER($2), $3) RETURNING *;', [body.fname, body.email, profilepicture])

     if(newUser.rows.length){
        req.session.userId = newUser.rows[0].id
        console.log('user success created, welcome ', newUser.rows[0].firstname)
        res.redirect('/')
     }else{
        console.log('user creation error !')
     }
     }catch(err){
        console.log(err)
     }
})

// log out
app.post('/logout', (req,res)=>{
    if(req.session.userId){
        req.session.destroy(err =>{
            if(err){
                console.error(err)
                return res.send('session failure ', err)
            }

            res.clearCookie('connect.sid')
            console.log('good bye, user')
            res.redirect('/')
        })
    }
})


app.post('/uploadProfile/:id', upload.single('userImage'), async(req,res)=>{
    const id = parseInt(req.params.id)
   try{
    if(!req.session.userId || req.session.userId !== id){
        console.log('unauthorized ! ')
        return res.send('unauthorized')
    }

    if(req.file){
        const selectedProfile = path.join('uploads/', req.file.filename)
        const uploadedPhoto = await pool.query('UPDATE users SET profilepicture =  $1 WHERE id = $2 RETURNING *;', [selectedProfile, id]);
        
        if(uploadedPhoto.rows.length > 0){
            console.log('upload success')
            res.redirect('/')
        }else{
            console.error('error failure')
            return res.send('failure uplaod')
        }
    }
   }catch(err){
     console.log(err)
   }
})


// POSTS

app.get('/post/new', authenticate, (req,res)=>{
    res.render('newPost.ejs')
})

app.post('/post/add', authenticate, upload.single('postImage'),async(req,res)=>{
    const {title,description} = req.body
    console.log(title,description)
    const postImage = path.join('uploads/',req.file.filename)

    try{
          //insert post
    const newPost = await pool.query('INSERT INTO posts (title, description, postImage, userid) VALUES(LOWER($1),LOWER($2),$3, $4) RETURNING *', [title, description, postImage, req.session.userId])
    
    if(newPost.rows.length > 0){
        console.log('post success added')
        res.redirect('/')
    }else{
        return console.log('post insertion failure !')
    }
    }catch(err){
        console.log(err)
    }
});

app.get('/post/:id/update', authenticate, async(req,res)=>{
    const id = parseInt(req.params.id)
   const updatingUser = await pool.query('SELECT * FROM posts where id = $1', [id])
   if(updatingUser.rows[0]){
    res.render('updatePost.ejs', {post : updatingUser.rows[0]})
   }else{
       console.log('not found post !')
       return res.send('post not found')
   }
});

// POSSIBLE ERRORS : multer error /unexpected field = if name of the file in the form be called wrong in the single() method
app.put('/post/:id/update', upload.single('postImage'), async(req,res)=>{
    const id  = parseInt(req.params.id)
    const updateBody = {
        title : req.body.title.trim(),
        description : req.body.description.trim(),
    }
    const currentpost = await pool.query('select * from posts where id = $1', [id])
     //if no image update, keep the prevous image 
     const profile = req.file? path.join('uploads/', req.file.filename) : currentpost.rows[0].postimage

     const updatedPost = await pool.query('UPDATE posts SET title = $1, description = $2, postimage = $3 WHERE id = $4 RETURNING *', [updateBody.title, updateBody.description, profile, id])

     if(updatedPost.rows.length > 0){
        console.log('post update success')
        res.redirect('/')
     }else{
        console.log('failure update')
        return res.send('failure update')
     }
})

app.delete('/post/:id/delete', authenticate, async(req,res)=>{
    const id = req.params.id
    const deletedPost = await pool.query('DELETE FROM posts where id = $1 RETURNING *', [id])
    if(deletedPost.rows.length> 0){
        console.log('post deleted success')
        res.redirect('/')
    }else{
        console.log('failure deletion of post')
        res.send('failure deletion')
    }
})


// chat home

app.get('/chatroom', (req,res)=>{
    res.render('chat.ejs')
})
function authenticate(req,res,next){
    if(req.session.userId){
       next()
    }else{
      res.redirect('/login')
    }
 }

//  pool.query('CREATE TABLE posts (id SERIAL PRIMARY KEY, title VARCHAR(50), description TEXT, postImage TEXT, userId INT REFERENCES users(id) ON DELETE CASCADE)').then((data)=>{
//     console.log('created data ', data.rows)
//  }).catch((err) => console.log(err));

const port = process.env.port || 3000

server.listen(port, ()=> console.log('connected'))