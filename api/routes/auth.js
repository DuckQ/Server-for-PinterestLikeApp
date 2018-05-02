const express = require('express');
const router = express.Router();
const Users = require('../models/users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');

router.post('/', (req, res, next) => {
  const { identifier, password } = req.body;
  Users
    .find()
    .or([
      {username: req.body.identifier},
      {email: req.body.identifier}
    ])
    .exec()
    .then(user => {
      if (user.length >=1 ) {
        if (bcrypt.compareSync(password, user[0].password_digest)) {
          let jwtSecretKey = process.env.jwtSecretKey || config.jwtSecretKey;
          const token = jwt.sign(
            {
            id: user[0]._id,
            username: user[0].username,
            userAvatar: user[0].userAvatar
            },
            jwtSecretKey,
            {
              expiresIn: "1h"
            }
            );
            res.json({ token })
        } else {
          res.status(401).json({ errors: { form: 'Invalid Credentials' } })
        }
      } else {
        res.status(401).json({ errors: { form: 'Invalid Credentials' } })
      }
    })
});

module.exports = router;