/**
 * Bitwarden has a very loosely enforced API in terms of case-sensitivity
 * The API accepts any case and clients actually send a mix
 * For compatibility, we just use lowercase everywhere
 */
function normalizeBody(body) {
  const normalized = {};
  Object.keys(body).forEach((key) => {
    normalized[key.toLowerCase()] = body[key];
  });

  return normalized;
}

function okResponse(body, res) {
  console.log('Success response');
  if(body === '') body = '{}';
  res.json(typeof body === 'string' ? JSON.parse(body): body);
}

function validationError(message, res) {
  console.log('Validation error', { message });
  res.status(400).send({
    ValidationErrors: {
      '': [
        message,
      ],
    },
    Object: 'error',
  });
}

function serverError(message, error, res) {
  console.log('Server error', { message, error });
  res.status(500).send({
    Message: message,
    Object: 'error',
  });
}

module.exports = {
  normalizeBody,
  okResponse,
  validationError,
  serverError,
};
