exports.PORT = process.env.PORT || 3334;

exports.DB_URL = process.env.NODE_ENV === 'production'
  ? process.env.DB_URL
  : 'mongodb://127.0.0.1:27017/samdivtech'

exports.S3_BUCKET = "my-bucket-name"
exports.AWS_ACCESS_KEY_ID = "ALOTOFCHARACTERS"
exports.AWS_SECRET_ACCESS_KEY = "aLotMORErandomCHARACTERSformingAhash"

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;