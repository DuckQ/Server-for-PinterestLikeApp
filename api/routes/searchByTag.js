const express = require('express');
const router = express.Router();

const Images = require('../models/images');

router.get('/:tag', (req, res, next) => {
  const tag = req.params.tag;
  Images.find({ main_tag: tag })
  .select('-__v')
  .exec()
  .then(images => {
    res.status(200).json({count: images.length, images})
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({error: err})
  });
});

module.exports = router;