require("dotenv").config();

module.exports = {
  app: {
    dbPort: 3000,
    secret: process.env.APP_SECRET_KEY_PROD,
    mongodbUri: process.env.MONGODB_URI_PROD
  }
}
