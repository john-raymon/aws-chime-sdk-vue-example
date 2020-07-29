function isBodyMissingProps(requiredProps = [], body) {
  let hasMissingProps = false;

  const propErrors = requiredProps.reduce((errors, [prop, errorMessage, noEmptyStrings = false]) => {
    if (body[prop] === undefined || typeof body[prop] === "undefined" || (noEmptyStrings && !body[prop])) {
      hasMissingProps = true;
      errors[prop] = { message: errorMessage || `${prop} is required` };
    }
    return errors;
  }, {});

  return {
    hasMissingProps,
    propErrors
  };
}

module.exports = isBodyMissingProps;
