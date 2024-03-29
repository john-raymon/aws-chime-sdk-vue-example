(All boilerplate was generated using my template (https://github.com/john-raymon/nodejs-express-vue-template))

### AWS Chime SDK example using Node.js, Express, Vue.js & MongoDB

Live demo link: https://gatherly-demo.herokuapp.com

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

# How to create a meeting room and invite someone via a sharable link:

1. On the landing-page click on the "create a meeting" button to initiate a new meeting room.
![](https://i.ibb.co/mhxbZbh/gatherly-1.jpg)

2. After clicking on "create a meeting" you'll be redirected to a meeting room, where a sharable link will be generated including the unique meeting id in the URL path. Copy and share this link with someone for them to join.
![](https://i.ibb.co/4NR4Bww/gatherly-2.jpg)

3. Once all attendees have joined, you should both see each other's beautiful faces 😎
![gatherly-3](https://github.com/john-raymon/aws-chime-sdk-vue-example/assets/30238579/49257728-f486-4aab-bf33-5d0c95dbde85)




