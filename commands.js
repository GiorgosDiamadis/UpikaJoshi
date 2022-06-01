var program = require('commander');
var fs = require('fs');
var crypto = require('crypto');

var Table = require('cli-table');
var axios = require('axios');
const {Octokit} = require("@octokit/core");
const {createPullRequest} = require("octokit-plugin-create-pull-request");
const MyOctokit = Octokit.plugin(createPullRequest);

const TOKEN = "YOUR TOKEN";
const octokit = new MyOctokit({
    auth: TOKEN,
});

program.version('1.0').description('Version Checker')

var table = new Table({
    head: ['name', 'repo', 'version', 'version_satisfied', 'update_pr']
});

program
    .argument('<csvFile>', 'The csv file you want to check the versions. Must be in the same directory.')
    .argument('<pkg>', 'The package that you want to check, must be in this format <name>@<x.y.z>.')
    .option('-update', 'Create a pull request in order to update the package on the repos that it is needed.')
    .option('-i', 'Follow this with the name of the input file, must be csv and in the same directory.')
    .action(async (csvFile, pkg, options) => {

        var data = fs.readFileSync(csvFile, "utf-8");
        data = data.split("\r\n")

        for (let i = 1; i < data.length; i++) {
            data[i] = data[i].split(",");
            data[i].length = data[i].length + 2;

            const repoTmp = data[i][1].split("/");

            var repo = repoTmp[repoTmp.length - 1]

            var user = repoTmp[repoTmp.length - 2]
            if (repo === '') {
                repo = repoTmp[repoTmp.length - 2]
                user = repoTmp[repoTmp.length - 3]
            }
            /**
             * Get package.json from the repository. The package should in the root directory of the repo.
             */
            const pkgGit = await axios.get(`https://api.github.com/repos/${user}/${repo}/contents/package.json`, {
                headers: {"Authorization": ` Token ${TOKEN}`}
            });


            /**
             * Decode package.json and parse it to a JavaScript object
             * @type {Buffer}
             */
            const buff = Buffer.from(pkgGit.data.content, 'base64');
            const str = buff.toString('utf-8');
            var packageJSON = JSON.parse(str);

            /**
             * The package to check. desired[0] -> package name, desired[1] -> package version
             */
            var desired = pkg.split('@');


            /**
             * Check if it exists,if not print N/A and go to next csv entry
             * @type {string|string}
             */
            data[i][2] = packageJSON.dependencies[desired[0]] ? packageJSON.dependencies[desired[0]].replaceAll('^', '').replaceAll('^', '') : "N/A";
            if (data[i][2] === 'N/A') {
                data[i][3] = 'false';
                table.push(data[i]);
                continue;
            }

            /**
             * Check version compatibility. Remove all . and ^ and concatenate numbers to form an integer which will be used for comparison
             * This is why we need this format for the package <name>@<x.y.z>
             * @type {number}
             */
            var k = parseInt(desired[1].replaceAll('.', ''));
            var l = parseInt(packageJSON.dependencies[desired[0]].replaceAll('^', '').replaceAll('.', ''));
            if (k <= l) {

                data[i][3] = "true";
            } else {

                if (options.Update) {
                    try {

                        /**
                         * Create a reference in order to create a pull request.
                         * @type {Hash}
                         */
                        var shasum = crypto.createHash('sha1')
                        shasum.update(`update-${desired[0]}`);
                        await axios.post(`https://api.github.com/repos/${user}/${repo}/git/refs`, {
                            "ref": `refs/heads/update-${desired[0]}`, "sha": shasum.digest('hex'), "force": true
                        }, {
                            headers: {"Authorization": ` Token ${TOKEN}`}
                        });

                    } catch (e) {

                    }

                    const commitText = `Update package ${desired[0]} from version ${packageJSON.dependencies[desired[0]]} to ${desired[1]}`;

                    /**
                     * Update package.json and create a pull request.
                     */
                    packageJSON.dependencies[desired[0]] = desired[1];
                    try {
                        const pr = await octokit
                            .createPullRequest({
                                owner: user,
                                repo: repo,
                                title: `Update ${desired[0]}`,
                                body: `${desired[0]} needs to be updated`,
                                head: `update-${desired[0]}`,
                                changes: [
                                    {
                                        files: {
                                            "package.json": JSON.stringify(packageJSON)
                                        },
                                        commit:
                                        commitText,
                                    },
                                ],
                            })
                        data[i].length = 5;
                        data[i][4] = `${data[i][1]}/pull/${pr.data.number}`
                    } catch (e) {
                    }
                }
                data[i][3] = "false";
            }
            table.push(data[i]);
        }

        console.log(table.toString())
    });


program.parse(process.argv)

