const mongoose = require('mongoose');

const ImagesSchema = mongoose.Schema({
  source: {type: String, required: true},
  original_timestamp: {type: Number},
  image_url: {type: String, unique: true},
  main_tag: {type: String},
  tags: {type: Array},
});

module.exports = mongoose.model('Images', ImagesSchema);

