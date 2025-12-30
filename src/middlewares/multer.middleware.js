import multer from "multer";

// we can use both memory storage and disk storage but 
// we use disk storage because memory storage can get full quickly
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

export const upload = multer({ 
    storage: storage 
})