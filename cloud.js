const AV = require('leanengine');
const { setupHandler, completeHandler } = require('./routes/two_factor');

AV.Cloud.define('TWO_FACTOR_SETUP', function (req) {
    const { email } = req.params;
    setupHandler(email);
});

AV.Cloud.define('TWO_FACTOR_COMPLETE', function (req) {
    const { email, code } = req.params;
    completeHandler(email, code);
});
