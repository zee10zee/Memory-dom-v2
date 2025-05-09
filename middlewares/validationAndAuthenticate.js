import session from "express-session";
import pool from "../db/db.js";
export const loggedInUsers = new Map()

export async function validate(req,res,next){
    if(req.session.userId){
        const userId = req.session.userId;
            const loggedInUser = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
            const user = loggedInUser.rows[0]
            if(!loggedInUsers.has(userId)){
                loggedInUsers.set(userId, user)
            }

            res.locals.loggedinUser = user;
       
    }else{
         console.log('no session')
    }
    next()
};

export function authenticate(req,res,next){
    if(req.session.userId){
       next()
    }else{
      res.redirect('/login')
    }
 }
