const express = require('express');
const router = express.Router();

const Images = require('../models/images');

router.get('/', (req, res, next) => {
  Images.find()
  .select('-__v') //.select('_id source ...')
  .exec()
  .then(docs => {
    const response = {
      count: docs.length,
      //images: docs
      images: docs.map(doc => {
        return {
          id: doc._id,
          source: doc.source,
          original_timestamp: doc.original_timestamp,
          image_url: doc.image_url,
          main_tag: doc.main_tag,
          tags: doc.tags,
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

router.get('/:imageId', (req, res, next) => {
  const id = req.params.imageId;
  Images.findById(id)
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

router.get('/last/:tag', (req, res, next) => {
  Images.find({main_tag: req.params.tag})
  .sort({ field: 'asc', _id: -1 })
  .limit(1)
  .select('original_timestamp -_id')
  .exec()
  .then(doc => {
    res.status(200).json(doc);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({
      error: err
    });
  });
});

router.post('/', (req, res, next) => {
      const images = new Images({
        source: req.body.source,
        original_timestamp: req.body.original_timestamp,
        image_url: req.body.image_url,
        main_tag: req.body.main_tag,
        tags: req.body.tags
      });
      images
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
});

// router.delete('/', (req, res, next) => {
//   Images.remove()
//   .exec()
//   .then(result => {
//     res.status(200).json({
//       message: 'Posts were successfully deleted'
//     });
//   })
//   .catch(err => {
//     console.log(err);
//     res.status(500).json({error: err});
//   });
// });

module.exports = router;