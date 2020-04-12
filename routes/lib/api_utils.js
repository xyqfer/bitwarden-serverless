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

/**
 * Unless the Webvault runs on the same domain, it requires some custom CORS settings
 *
 * Pragma,Cache-Control are used by the revision date endpoints
 * Device-Type is used by login
 */
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Content-Type,Authorization,Accept,Device-type,Pragma,Cache-Control',
};

function okResponse(body, res) {
  console.log('Success response');
  if(body === '') body = '{}';
  res.json(typeof body === 'string' ? JSON.parse(body): body);
}

function validationError(message, res) {
  console.log('Validation error', { message });
  res.status(400).send(
    JSON.stringify({
      ValidationErrors: {
        '': [
          message,
        ],
      },
      Object: 'error',
    })
  );
}

function serverError(message, error, res) {
  console.log('Server error', { message, error });
  res.status(500).send(
    JSON.stringify({
      Message: message,
      Object: 'error',
    })
  );
}

module.exports = {
  normalizeBody,
  CORS_HEADERS,
  okResponse,
  validationError,
  serverError,
};
