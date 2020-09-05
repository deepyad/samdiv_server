const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Data we need to collect/confirm to have the app go.
const fields = {
  blogId: {
    type: String
  },
  email: {
    type: String
  },
}

// One nice, clean line to create the Schema.
const likeblogSchema = new Schema(fields)

module.exports = mongoose.model('likeblog', likeblogSchema)