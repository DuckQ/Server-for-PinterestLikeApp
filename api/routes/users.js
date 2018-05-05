const express = require('express');
const router = express.Router();
const Users = require('../models/users');
const validateSignup = require('../validation/signup');
const validatePatch = require('../validation/patch');
const bcrypt = require('bcrypt');
const multer = require('multer');
const authenticate = require('../middlewares/authenticate');
const jwt = require('jsonwebtoken');
const config = require('../../config');

// Amazon S3 Setup

const aws = require('aws-sdk');
aws.config.region = process.env.AWS_REGION || config.aws_region;
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || config.accessKeyId,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || config.secretAccessKey
});
const s3 = new aws.S3();

const multerS3 = require('multer-s3');

const storage = multerS3({
  s3: s3,
  bucket:  process.env.S3_BUCKET || config.bucket,
  acl: 'public-read',
  metadata: function (req, file, cb) {
    cb(null, {fieldName: file.fieldname});
  },
  key: function (req, file, cb) {
    const filename = `${Date.now().toString()}-${file.originalname}`
    cb(null, filename)
  }
});

// Local upload

// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, './uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, new Date().toISOString().replace(/:/g,'-') + file.originalname); // in Windows files cannot have name that includes ":"
//   }
// });

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Only jpeg and png filetypes are accepted'), false);
  }
};

const limits = {fileSize: 1024*1024};

const upload = multer({storage, limits, fileFilter})




router.get('/', (req, res, next) => {
  Users.find()
  .select('-__v')
  .exec()
  .then(docs => {
    const response = {
      count: docs.length,
      users: docs.map(doc => {
        return {
          id: doc._id,
          username: doc.username,
          email: doc.email,
          password_digest: doc.password_digest,
          userAvatar: doc.userAvatar,
          savedImages: doc.savedImages
        }
      })
    };
    res.status(200).json(response);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({
      error: err
    });
  });
});

router.get('/:userId', (req, res, next) => {
  const id = req.params.userId;
  Users.findById(id)
  .select('-__v')
  .exec()
  .then(doc => {
    if (doc) {
      res.status(200).json(doc);
    } else {
      res.status(404).json({message: 'No valid entry found for provided ID'})
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({error: err})
  });
});

router.get('/check/:identifier', (req, res, next) => {
  const identifier = req.params.identifier;
  Users.find()
    .select('email -_id')
    .or([ {email: identifier} ])
    .exec()
    .then(user => res.json({ user })) 
})

router.post('/', upload.single('userAvatar'), (req, res, next) => {
  const { errors, isValid } = validateSignup(req.body);
  Users.find().or([ 
    {username: req.body.username},
    {email: req.body.email}
    ]).exec()
    .then(user => {
      if (user.length >= 1) {
        if (user[0].email === req.body.email) {
            errors.email = 'Email is already registered';
        }
        if (user[0].username === req.body.username) {
          errors.username = 'Sorry, username has been taken';
        }
        return res.status(400).json({ errors });
      } else {
        if (isValid) {
          const password_digest = bcrypt.hashSync(req.body.password, 10);
          const users = new Users({
            username: req.body.username,
            email: req.body.email,
            password_digest,
            userAvatar: '',
            savedImages: []
          });
          users
          .save()
          .then(result => {  
            res.status(201).json({
                id: result._id
            });  
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({error: err})
          });
        } else {
          res.status(400).json({ errors })
        }
      }
    })
});

router.patch('/:userId', authenticate, upload.single('userAvatar'), (req, res, next) => {

  //check if file was added 
  let newAvatarUrl = '';
  if (req.file) {
    const s3Params = {
      Bucket: process.env.S3_BUCKET || config.bucket,
      Key: req.file.key
    };
    newAvatarUrl = s3.getSignedUrl('getObject', s3Params);
  }

  const { errors, isValid } = validatePatch(req.body);
  const id = req.params.userId;
  
  // response will include token with this data if it's necessary, otherwise old username and avatar will be added
  let newUsername, newUserAvatar, newSavedImages;

  // check if updates are required
  const updatedInf = {};
  if (req.body.username) {
    updatedInf.username = req.body.username;
    newUsername = req.body.username;
  };
  if (req.body.email) {
    updatedInf.email = req.body.email
  };
  if (req.body.password) {
    const password_digest = bcrypt.hashSync(req.body.password, 10);
    updatedInf.password_digest = password_digest
  };
  if (req.file) {
    updatedInf.userAvatar = newAvatarUrl.split('?')[0];
    newUserAvatar = newAvatarUrl.split('?')[0];
  };
  if (req.body.savedImage) {
    const newSavedImage = req.body.savedImage;
    updatedInf.savedImages = req.currentUser.savedImages.concat(newSavedImage);
    newSavedImages = req.currentUser.savedImages.concat(newSavedImage);
  };

  // check for unique username and email
  Users.find().or([ 
    {username: req.body.username},
    {email: req.body.email}
    ]).exec()
    .then(user => {
      if (user.length >= 1) {
        if (user[0].email === req.body.email) {
          errors.email = 'Email is already registered';
        }
        if (user[0].username === req.body.username) {
          errors.username = 'Sorry, username has been taken';
        }
        return res.status(400).json({ errors });
      } else {
        if (isValid) {
          Users.update({_id: id}, {$set: updatedInf})
          .exec()
          .then(result => {
            let jwtSecretKey = process.env.jwtSecretKey || config.jwtSecretKey;
            // send new token with incoded updated infromation
            const token = jwt.sign({
              id: req.currentUser.id,
              username: newUsername ? newUsername : req.currentUser.username,
              userAvatar: newUserAvatar ? newUserAvatar : req.currentUser.userAvatar,
              savedImages: newSavedImages ? newSavedImages : req.currentUser.savedImages,
              },
              jwtSecretKey,
              {
                expiresIn: "1h"
            });
            res.status(200).json({
              message: 'User information was successfully updated',
              token
            });
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            });
          });
        } else {
          res.status(400).json({ errors })
        }
      }
    });
});

// router.delete('/:userId', (req, res, next) => {
//   const id = req.params.userId;
//   Users.remove({_id: id})
//   .exec()
//   .then(result => {
//     res.status(200).json({
//       message: 'User was successfully deleted'
//     });
//   })
//   .catch(err => {
//     console.log(err);
//     res.status(500).json({error: err});
//   });
// });

// router.delete('/', (req, res, next) => {
//   Users.remove()
//   .exec()
//   .then(result => {
//     res.status(200).json({
//       message: 'All users were successfully deleted'
//     });
//   })
//   .catch(err => {
//     console.log(err);
//     res.status(500).json({error: err});
//   });
// });

module.exports = router;