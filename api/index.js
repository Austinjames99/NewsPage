const express = require('express')
const cors = require('cors') //used for error with network sending credentials
const mongoose = require('mongoose')
const User = require('./models/user')
const Post = require('./models/Post')
const bcrypt = require('bcryptjs') //password encryption
const app = express()
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const multer = require('multer') // used to upload files
const uploadMiddleware = multer({ dest: '/tmp'})
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3')
const fs = require('fs') //filesytem access 
const mime = require('mime-types')

require('dotenv').config


const salt = bcrypt.genSaltSync(10)//needed to make bcrypt work
const secret = "hdfhsdhfjasdhjfsdahfsdhdf"
const bucket = 'austin-news-app'

app.use(cors({credentials:true, origin:'http://localhost:3000'}))
app.use(express.json())
app.use(cookieParser())
//app.use('/uploads', express.static(__dirname + '/uploads'))

//mongoose.connect('mongodb+srv://newsapp:eM9QFIHWyEz2Wrtu@cluster0.e8evabe.mongodb.net/?retryWrites=true&w=majority')

async function uploadToS3(path, originalFilename, mimetype) {
    const client = new S3Client({
        region: 'us-east-1',
        credentials: {
            accessKeyId: 'AKIAURGQVFT7ZRYWSEAH',//process.env.S3AK,
            secretAccessKey: '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', //process.env.S3Secret,
        },
    })
    const parts = originalFilename.split('.')
    const ext = parts[parts.length -1]
    const newFilename = Date.now() + '.' + ext 
    //const data = 
    await client.send(new PutObjectCommand({
        Bucket: bucket,
        Body: fs.readFileSync(path),
        Key: newFilename,
        ContentType: mimetype,
        ACL: 'public-read',
    }))
    return `https://${bucket}.s3.amazonaws.com/${newFilename}`
    //console.log({data})
   //console.log({path, mimetype, ext, newFilename})
}



app.post('/register', async (req,res) => {
    mongoose.connect('mongodb+srv://newsapp:eM9QFIHWyEz2Wrtu@cluster0.e8evabe.mongodb.net/?retryWrites=true&w=majority')
    const {username,password} = req.body
    try{
        const userDoc = await User.create({
            username, 
            password:bcrypt.hashSync(password, salt), //password encrytpion
        })
        res.json(userDoc)
    }   catch(e) {
        console.log(e) //test console.log errors ----delete later -aj
        res.status(400).json(e) //Error handling if user is not unique
    }
     
})

app.post('/login', async (req, res) => {
    mongoose.connect('mongodb+srv://newsapp:eM9QFIHWyEz2Wrtu@cluster0.e8evabe.mongodb.net/?retryWrites=true&w=majority')
    const {username, password} = req.body
    const userDoc = await User.findOne({username}) // grabs username
    const passOk = bcrypt.compareSync(password, userDoc.password) //check encrypted password
    if(passOk){
        //user gets logged in
        jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
            if(err) throw err
            res.cookie('token', token).json('ok') //sends back a cookie
        })
    } else{
        res.status(400).json('Wrong Username or Password')
    }
})

 //endpoint for profile (checking if logged in)
app.get('/profile', (req,res) => { 
    mongoose.connect('mongodb+srv://newsapp:eM9QFIHWyEz2Wrtu@cluster0.e8evabe.mongodb.net/?retryWrites=true&w=majority')
    const {token} = req.cookies
    jwt.verify(token, secret, {}, (err,info) => {
        if (err) throw err
        res.json(info)
    })
})
//logout endpoint
app.post('/logout', (req,res) => {
    res.cookie('token', '').json({
        id:userDoc._id,
        username,
    })
})
//endpoint for file uploads, code for renaming files
app.post('/post',uploadMiddleware.single('file'), 
    async (req,res) => {
    const uploadedFiles = []   
    const {originalname,path,mimetype} = req.file
    const url = await uploadToS3(path, originalname, mimetype)
    uploadedFiles.push(url)
    //res.json(uploadedFiles)
    const parts = originalname.split('.')
    const ext = parts[parts.length - 1]
    const newPath = path+'.'+ext
    fs.renameSync(path, newPath)

    const {token} = req.cookies
    jwt.verify(token, secret, {}, async (err,info) => {
        if (err) throw err
        const {title,summary,content} = req.body
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover:newPath,
            author:info.id,
    
        })
        res.json({postDoc, uploadedFiles})
      })

 



    


})

app.get('/post', async (req,res) =>{
    mongoose.connect('mongodb+srv://newsapp:eM9QFIHWyEz2Wrtu@cluster0.e8evabe.mongodb.net/?retryWrites=true&w=majority')
    res.json(await Post.find().populate('author', ['username']).sort({createdAt: -1}).limit(20))
})


app.get('/post/:id', async (req, res) => {
    mongoose.connect('mongodb+srv://newsapp:eM9QFIHWyEz2Wrtu@cluster0.e8evabe.mongodb.net/?retryWrites=true&w=majority')
    const {id} = req.params
    const postDoc = await Post.findById(id).populate('author', ['username'])
    res.json(postDoc)
})
app.listen(4000)

//eM9QFIHWyEz2Wrtu --- mongo password - delete later - aj
//mongodb+srv://newsapp:eM9QFIHWyEz2Wrtu@cluster0.e8evabe.mongodb.net/?retryWrites=true&w=majority ---delete later -- aj