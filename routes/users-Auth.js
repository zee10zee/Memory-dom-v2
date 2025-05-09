import pool from "../db/db.js"
import upload from "../middlewares/multer.js/multer.js"
import session from "express-session"
import express from "express"
import path from "path"
import { loggedInUsers } from "../middlewares/validationAndAuthenticate.js"

const router = express.Router()

router.use(express.json());

router.get('/signUp', (req,res)=>{
    res.render('signup.ejs')
})

router.get('/login', (req,res)=>{
        res.render('login.ejs')
})

router.post('/login', async(req,res)=>{
    const {email, password} = req.body
   try{
     // if user exists in db with these credentials // CHECK DB NOT session
     const foundUser = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2;',[email, password])

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


router.post('/signup', upload.single('userImage'),async(req,res)=>{
   const body = {
     fname : req.body.firstname,
     email : req.body.email,
     password : req.body.password,
   }

     try{
        const user = await pool.query('SELECT * FROM users WHERE password = $1 AND email = $2', [body.password, body.email]);

     if(user.rows.length > 0){
       return res.send('this account already exists ! please log in ! ')
     }

     const profilepicture = req.file? path.join('uploads/', req.file.filename): null

     const newUser = await pool.query('INSERT INTO users (firstname, email, password, profilepicture) VALUES(LOWER($1), LOWER($2), LOWER($3), $4) RETURNING *;', [body.fname, body.email, body.password,profilepicture])

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
router.post('/logout', (req,res)=>{
    const userId = req.session.userId
    console.log('log out route ', loggedInUsers)
    // remove the logged in user from the logged in users list 
    if(userId && loggedInUsers.has(userId)){
       loggedInUsers.delete(userId)
       console.log(userId, ' removed from the map')
    }

    req.session.destroy(err =>{
        if(err){
            console.error(err)
            return res.send('session failure ', err)
        }

        res.clearCookie('connect.sid')
        console.log('good bye, user')
        res.redirect('/')
    })
})


router.post('/uploadProfile/:id', upload.single('userImage'), async(req,res)=>{
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
function authenticate(req,res,next){
    if(req.session.userId){
       next()
    }else{
      res.redirect('/login')
    }
 }

 export default router
