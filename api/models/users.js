const mongoose = require('mongoose');

const UsersSchema = mongoose.Schema({
  username: {type: String, required: true },
  email: {type: String, required: true},
  password_digest: {type: String, required: true },
  userAvatar: {type: String}
});

module.exports = mongoose.model('Users', UsersSchema);

