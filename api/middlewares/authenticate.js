const jwt = require('jsonwebtoken');
const Users = require('../models/users');
const config = require('../../config');

module.exports = (req, res, next) => {
  let token;
  if (req.headers.authorization !== null ) {
    token = req.headers.authorization.split(" ")[1];
  } 
  if (token) {
    let jwtSecretKey = process.env.jwtSecretKey || config.jwtSecretKey;
    jwt.verify(token, jwtSecretKey, (err, decoded) => {
      if (err) {
        res.status(401).json({ error: 'Failed to authenticate' })
      } else {
        const id = decoded.id
        Users.findById(id)
        .exec()
        .then(user => {
          if (!user) {
            res.status(404).json({ error: 'No such user' })
          } else {
            req.currentUser = decoded;
            next()
          }
        })
        
      }
    })
  } else {
    res.status(403).json({
      error: 'No token provided'
    })
  }
}