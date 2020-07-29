const express = require('express');
const router = express.Router();
const service = require('@/services/users');
const middlewares = require('@/middlewares');

router.post('/', ...service.create);

router.get('/', middlewares.requireAuthUser, function(req, res, next) {
  return res.json({
    user: req.authUser.authSerialize(false),
  })
})

router.post('/login', ...service.login);

module.exports = router;
