import multer, { diskStorage } from "multer"
import path from "path"

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

export default upload;