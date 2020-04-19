const AV = require('leanengine');
const fs = require('fs');
const Git = require('simple-git/promise');
const { setupHandler, completeHandler } = require('./routes/two_factor');
const { extractData } = require('./routes/lib/models');

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
        const userName = process.env.GITHUB_USER_NAME;
        const userEmail = process.env.GITHUB_USER_EMAIL;
        const password = process.env.GITHUB_PASSWORD;
        const repoName = process.env.GITHUB_REPO_NAME;

        const remote = `https://${userName}:${password}@github.com/${userName}/${repoName}`;
        const workDir = '/tmp';
        let git = Git(workDir);

        await git.silent(false);
        await git.clone(remote);

        const data = await extractData();
        fs.writeFileSync(`${workDir}/${repoName}/db.json`, JSON.stringify(data));

        git = Git(`${workDir}/${repoName}`)
            .addConfig('user.name', userName)
            .addConfig('user.email', userEmail);
        await git.add('*');
        await git.commit('add db backup');
        await git.push('origin');
    })();
});
