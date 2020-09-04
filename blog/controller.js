// const Blog = require('../blog.model')
const Blog = require("../blog.model")
const UserComment = require("../usercomment.model")
const LikeBlog = require("../like.model")
const today = new Date().toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
})

exports.saveComment = (req, res) => {
    const { comment } = req.body

    UserComment.find()
        .sort({ selfId: -1 })
        .limit(1)
        .exec(function (err, result) {
            if (err) throw console.log("Error in saveComment : ", err)
            // set the data sequence
            var selfId = 1
            if(result.length !== 0)
                selfId = parseInt(result[0].selfId) + 1
            
            comment.selfId = selfId
            comment.commentAllow = true

            UserComment.create(comment, function (err, results) {
                if (err) throw err
                if (results) {
                    _getBlogAndComment(comment.blogId, res)
                }
            })
        })
}

exports.getCommentListWithBlogName = (req, res) => {
    _getCommentListWithBlogName(res)
}

function _getCommentListWithBlogName(res) {
    UserComment.find().exec(async function (err, result) {
        if (err)
            throw console.log("Error in getCommentListWithBlogName : ", err)

        var resp = []
        for (const record of result) {
            const doc = await Blog.findOne({ _id: record.blogId })

            if (!doc) continue

            resp.push({ ...record._doc, blogTitle: doc.blogTitle })
        }

        res.json(resp)
    })
}

exports.updateCommentBlockAndAllow = (req, res) => {
    const comment = req.body

    UserComment.findByIdAndUpdate(
        { _id: comment.blockId },
        { commentAllow: !comment.blockStatus }
    )
        .then(() => {
            _getCommentListWithBlogName(res)
        })
        .catch((err) =>
            console.log("Error in UpdateCommentBlockAndAllow : ", err)
        )
}

exports.deleteComment = async (req, res) => {
    const comment = req.body

    await UserComment.findOne({ _id: comment.deleteId }, async function (err, item) {
        if (err) console.log("Error in finding the delete comments : ", err)

        if (item) {
            const getCommentTree = async (blogId, parentId) => {
                // console.log("children : ------- ", blogId, parentId)
                await UserComment.deleteOne({
                    blogId: blogId,
                    selfId: parentId,
                })
                // .then(() => _getCommentListWithBlogName(res))
                .catch((err) => console.log("DeleteComment err : ", err))

                return new Promise(async (resolve, reject) => {
                    // const ret = []
                    UserComment.find()
                        .where({ blogId, parentId })
                        .exec(async function (err, comments) {
                            if (err) resolve([])
                            else {
                                if (comments.length > 0) {
                                    for (const comment of comments) {
                                        const children = [
                                            ...(await getCommentTree(
                                                blogId,
                                                comment.selfId
                                            )),
                                        ]
                                        // ret.push({ ...comment._doc, children })
                                    }
                                }
                                // resolve(ret)
                            }
                        })
                })
            }
            await getCommentTree(item.blogId, item.selfId)
        }
    })
    setTimeout(() => {
        _getCommentListWithBlogName(res)
    }, 2000);
}

exports.getBlogAndComment = (req, res) => {
    const { blogId } = req.body
    _getBlogAndComment(blogId, res)
}

function _getBlogAndComment(blog_id, res) {
    const results = {}
    var parTmp = 100

    Blog.find()
        .where("_id", blog_id)
        .exec(async function (err, blogs) {
            results.blogData = blogs
            const getCommentTree = (blogId, parentId) => {
                return new Promise(async (resolve, reject) => {
                    const ret = []
                    UserComment.find()
                        .where({ blogId, parentId })
                        .exec(async function (err, comments) {
                            if (err) {
                                resolve([])
                            } else {
                                if (comments.length > 0) {
                                    for (const comment of comments) {
                                        if (!comment.commentAllow) {
                                            parTmp = comment.parentId
                                            continue
                                        }
                                        if (comment.parentId > parTmp) continue
                                        if (comment.parentId <= parTmp)
                                            parTmp = 100

                                        const children = [
                                            ...(await getCommentTree(
                                                blogId,
                                                comment.selfId
                                            )),
                                        ]
                                        ret.push({ ...comment._doc, children })
                                    }
                                }
                                resolve(ret)
                            }
                        })
                })
            }
            const resJson = await getCommentTree(blog_id, 0)

            results.commentData = resJson

            UserComment.count({blogId: blog_id, commentAllow: true}, function (error, numOfDocs) {
                if (error) return callback(error)

                results.commentCount = numOfDocs
                res.json(results)
            })
        })
}

exports.getBlogWithID = (req, res) => {
    const { blogId } = req.body

    Blog.findOne({ _id: blogId }, function (err, item) {
        if (err) return console.log("Error in getBlogWithID : ", err)
        
        res.send(item)
    })
}

exports.getBlogList = (req, res) => {
    _getBlogList(res)
}

function _getBlogList(res) {
    Blog.find()
        .sort({ _id: -1 })
        .exec(function (err, result) {
            if (err) throw console.log("Error in getBlogList : ", err)
            
            res.json(result)
        })
}
exports.deleteBlogWithID = async (req, res) => {
    const { deleteId } = req.body

    Blog.deleteOne({
        _id: deleteId,
    })
    .then(() => _getBlogList(res))
    .catch((err) => console.log("DeleteComment err : ", err))
}

exports.insertBlog = (req, res) => {
    const { value } = req.body

    var titleArr = value.match(/<h1>.*?<\/h1>/g)
    var title = titleArr[0].replace(/<[^>]+>/g, "")

    Blog.create({ blogTitle: title, blogContent: value, curDate: today })
        .then(() => res.json("success"))
        .catch((err) => console.log("Error in insertBlog : ", err))
}

exports.updateBlog = (req, res) => {
    const blog = req.body

    var titleArr = blog.value.match(/<h1>.*?<\/h1>/g)
    var title = titleArr[0].replace(/<[^>]+>/g, "")

    Blog.findByIdAndUpdate(
        { _id: blog.blogId },
        {
            blogTitle: title,
            blogContent: blog.value,
            curDate: today,
        }
    )
        .then(() => res.json("success"))
        .catch((err) => console.log("Error in updateBlog ", err))
}

exports.getLikeCount = (req, res) => {
    const blog = req.body
    _getLikeCount(blog.blogId, res)
}

exports.updateLike = (req, res) => {
    const blog = req.body

    LikeBlog.findOne({ blogId: blog.blogId, email: blog.email }, function (
        err,
        item
    ) {
        if (err) console.log("Error finding in updateLike : ", err)

        // console.log("item : ", item)
        if (!item) {
            LikeBlog.create(
                { blogId: blog.blogId, email: blog.email },
                function (err, result) {
                    if (err) console.log("Error creating in updateLike : ", err)

                    if (result) {
                        _getLikeCount(blog.blogId, res)
                    }
                }
            )
        } else {
            _getLikeCount(blog.blogId, res)
        }
    })
}

function _getLikeCount(blogId, res) {
    LikeBlog.count({ blogId: blogId }, function (error, numOfDocs) {
        if (error) return callback(error)

        // console.log("numOfDocs : ", numOfDocs)
        res.json({ likecnt: numOfDocs, status: 1 })
    })
}
