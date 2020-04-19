const AV = require('leanengine');
const fs = require('fs');
const git = require('simple-git/promise')();
const { setupHandler, completeHandler } = require('./routes/two_factor');

AV.Cloud.define('TWO_FACTOR_SETUP', function (req) {
    const { email } = req.params;
    setupHandler(email);
});

AV.Cloud.define('TWO_FACTOR_COMPLETE', function (req) {
    const { email, code } = req.params;
    completeHandler(email, code);
});

AV.Cloud.define('BACKUP', function (req) {
    (async () => {
        const url = process.env.GITHUB_URL;
        const remote = `https://${process.env.GITHUB_USER_NAME}:${process.env.GITHUB_PASSWORD}@${url}`;

        await git.silent(false);
        await git.clone(remote);

        fs.writeFileSync('./bitwarden-backup/db.json', JSON.stringify({
            a: 1,
            b: 2,
        }));

        await git.add('*');
        await git.commit('add db backup');
        await git.push('origin');
    })();
});
