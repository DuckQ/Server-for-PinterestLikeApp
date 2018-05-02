module.exports = function validateInput(data) {
  let errors = {};

  if (!data.username) {
    errors.username = 'This field is required';
  };

  const validateEmail = (email) => {
    var re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return re.test(String(email).toLowerCase());
  };

  if (!validateEmail(data.email)) {
    errors.email = 'Email is invalid';
  };

  if (!data.email) {
    errors.email = 'This field is required';
  };

  if (!data.password) {
    errors.password = 'This field is required';
  };
  
  if (!data.passwordConfirmation) {
    errors.passwordConfirmation = 'This field is required';
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
 