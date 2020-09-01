// require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
// const AWS = require("aws-sdk")
// const fs = require("fs")
// const fileType = require("file-type")
// const bluebird = require("bluebird")
// const multiparty = require("multiparty")

const app = express()

const {
    PORT,
    DB_URL,
    S3_BUCKET,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
} = require("./config")

const blogController = require("./blog/controller")

// AWS.config.update({
//     accessKeyId: AWS_ACCESS_KEY_ID,
//     secretAccessKey: AWS_SECRET_ACCESS_KEY,
// })
// // configure AWS to work with promises
// AWS.config.setPromisesDependency(bluebird)
// // create S3 instance
// const s3 = new AWS.S3()

// allow requests from our client
app.use(cors())
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

// Allow the app to accept JSON on req.body
app.use(express.json())

app.use(express.static(path.join(__dirname, "build")))
app.get("/*", function (req, res) {
    res.sendFile(path.join(__dirname, "build", "index.html"))
})

// abstracts function to upload a file returning a promise
const uploadFile = (buffer, name, type) => {
    const params = {
        ACL: "public-read",
        Body: buffer,
        Bucket: S3_BUCKET,
        ContentType: type.mime,
        Key: `${name}.${type.ext}`,
    }
    return s3.upload(params).promise()
}

// Define POST route
app.post("/file-upload", (request, response) => {
    const form = new multiparty.Form()
    console.log("file-upload: ", request)
    form.parse(request, async (error, fields, files) => {
        if (error) throw new Error(error)
        try {
            const path = files.file[0].path
            const buffer = fs.readFileSync(path)
            const type = fileType(buffer)
            const timestamp = Date.now().toString()
            const fileName = `bucketFolder/${timestamp}-lg`
            const data = await uploadFile(buffer, fileName, type)
            return response.status(200).send(data)
        } catch (error) {
            return response.status(400).send(error)
        }
    })
})

// Handle Comment
app.post("/saveComment", blogController.saveComment)
app.post("/getBlogAndComment", blogController.getBlogAndComment)
app.post(
    "/getCommentListWithBlogName",
    blogController.getCommentListWithBlogName
)
app.post("/updateCommentBlockAndAllow", blogController.updateCommentBlockAndAllow)
app.post('/deleteComment', blogController.deleteComment)

// Handle Admin
app.post("/getBlogWithID", blogController.getBlogWithID)
app.post("/getBlogList", blogController.getBlogList)
app.post("/insertBlog", blogController.insertBlog)
app.post("/updateBlog", blogController.updateBlog)

// Handle Like
app.post("/getLikeCount", blogController.getLikeCount)
app.post("/updateLike", blogController.updateLike)


// Connecting the database and then starting the app.
mongoose.connect(DB_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
})

mongoose
    .connect(DB_URL)
    .then(() => {
        console.log("Connected to Database")
    })
    .catch((err) => {
        console.log("Not Connected to Database ERROR! ", err)
    })

require("http").createServer(app).listen(PORT)
console.log("Http server is running on Port: " + PORT)
