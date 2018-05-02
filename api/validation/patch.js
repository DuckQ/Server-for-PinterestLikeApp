module.exports = function validateInput(data) {
  let errors = {};

  const validateEmail = (email) => {
    var re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return re.test(String(email).toLowerCase());
  };

  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Email is invalid';
  };

  if (data.password !== data.passwordConfirmation) {
    errors.passwordConfirmation = 'Passwords must match';
  };

  const isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
  };
  
  return {
    errors,
    isValid: isEmpty(errors)
  }
}