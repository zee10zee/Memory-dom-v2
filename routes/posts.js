import express from "express"
import path from "path"
import upload from "../middlewares/multer.js/multer.js"
import pool from "../db/db.js"
const router = express.Router()
// POSTS

router.get('/post/new', authenticate, (req,res)=>{
    res.render('newPost.ejs')
})

router.post('/post/add', authenticate, upload.single('postImage'),async(req,res)=>{
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

router.get('/post/:id/update', authenticate, async(req,res)=>{
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
router.put('/post/:id/update', upload.single('postImage'), async(req,res)=>{
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

router.delete('/post/:id/delete', authenticate, async(req,res)=>{
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

function authenticate(req,res,next){
    if(req.session.userId){
       next()
    }else{
      res.redirect('/login')
    }
 }



export default router;