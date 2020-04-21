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
    console.log('BACKUP Start');
    (async () => {
        const userName = process.env.GITHUB_USER_NAME;
        const userEmail = process.env.GITHUB_USER_EMAIL;
        const password = process.env.GITHUB_PASSWORD;
        const repoName = process.env.GITHUB_REPO_NAME;
        const workDir = '/tmp';

        if (!fs.existsSync(`${workDir}/${repoName}`)) {
            const remote = `https://${userName}:${password}@github.com/${userName}/${repoName}`;
            let git = Git(workDir);
            await git.silent(false);
            await git.clone(remote);   
        }

        const data = await extractData();
        fs.writeFileSync(`${workDir}/${repoName}/db.json`, JSON.stringify(data));

        let git = Git(`${workDir}/${repoName}`);
        await git.silent(false);
        await git.addConfig('user.name', userName);
        await git.addConfig('user.email', userEmail);
        await git.add('*');
        await git.commit('add db backup');
        await git.push('origin');

        console.log('BACKUP Finish');
    })();
});
