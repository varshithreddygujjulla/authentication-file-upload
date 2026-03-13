import express from 'express'
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path'

const app = express();

app.use(express.urlencoded({extended:true}))

import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: 'dn9rpkt30',
    api_key: '879585912851839',
    api_secret: 'bFc21Tvx1K0RMyWO8M3MEmObAz8'
});

mongoose.connect("mongodb://127.0.0.1:27017/photouploader").then(() => { console.log("✅ MongoDB connected") });

app.set('view engine', 'ejs');
app.set('views', './views'); // assuming index.ejs is in /views


//rendering login.ejs file
app.get('/', (req, res) => {
    res.render('login.ejs', { url: null })
})

//rendering register file
app.get('/register', (req, res) => {
    res.render('register.ejs', { url: null })
})

const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname)
        cb(null, file.fieldname + "-" + uniqueSuffix)
    }
})

const upload = multer({ storage: storage })

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    filename: String,
    public_id: String,
    imageUrl: String
})

const User = mongoose.model("user", userSchema)


app.post('/register', upload.single('file'), async (req, res) => {
    const file = req.file.path;

    const { name, email, password } = req.body;

    const cloudinaryRes = await cloudinary.uploader.upload(file, {
        folder: "project_2"
    })

    // creating user
    const db = await User.create({
        name,
        email,
        password,
        filename: req.file.originalname,
        public_id: cloudinaryRes.public_id,
        imageUrl: cloudinaryRes.secure_url
    })

    res.redirect('/')
    // res.render("register.ejs", { url: cloudinaryRes.secure_url })

    // res.json({message:'file uploaded sucessfully',cloudinaryRes})
})


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            // user not found → redirect back to login
            return res.redirect('/');
        }

        if (user.password !== password) {
            // wrong password → show login page again
            return res.render('login.ejs', { error: 'Invalid credentials' });
        }

        // correct login → show profile
        res.render('profile.ejs', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

const port = 3000;
app.listen(port, () => console.log(`server is running on port ${port}`))