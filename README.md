# MEVN boilerplate. 

Generated using template (https://github.com/john-raymon/nodejs-express-vue-template)

# Add ENV keys:

Create an .env file with the keys from the .env.example file to the.

```
APP_SECRET_KEY_DEV=
MONGODB_URI_DEV=mongodb://127.0.0.1:27017/
AWSAccessKeyId=
AWSSecretKey=
```

Install MongoDB if not already installed and add the local MongoDB URI to the .env. 

# Install the server-side and client-side dependencies such as `aws-sdk` and `amazon-chime-sdk-js`

Install all dependencies & initiaize the Node.js server along with the client-side dev-server by running:

`yarn install && yarn --cwd client install && yarn dev-start`


