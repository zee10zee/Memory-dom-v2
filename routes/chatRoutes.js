import express from "express"
import { authenticate } from "../middlewares/validationAndAuthenticate.js"
import pool from "../db/db.js"
const router  = express.Router()

// chat home
router.get('/chatroom',authenticate,(req,res)=>{
    res.render('groupChat.ejs')
})

router.get('/oneToOneChat/:receiverId', authenticate, async(req,res)=>{
    const id = parseInt(req.params.receiverId)
  try{
    const receiver = await pool.query('SELECT * FROM users where id = $1', [id])
    const loggedInUser = await pool.query('SELECT * FROM users where id = $1', [req.session.userId])
    console.log('reciever' + receiver.rows[0].firstname,' logged in user '+ loggedInUser.rows[0].firstname)
 
    res.render('privateChat.ejs', {
        receiver : receiver.rows[0],
        loggedInUser : loggedInUser.rows[0]
    })
}catch(err){
    console.log(err)
    return res.status(505).send(err)
  }

})
export default router;
