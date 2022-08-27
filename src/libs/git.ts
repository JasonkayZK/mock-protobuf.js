import path from 'path';
import fs from 'fs-extra';
import shell from 'shelljs';

export function initRepository(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const protoPath = path.join(process.env.HOME || '', '.proto_tmp');
        fs.ensureDirSync(protoPath);
        try {
            const configPath = path.join(process.cwd(), '.fakerpbrc');
            const config = JSON.parse(
                fs.readFileSync(configPath, {encoding: 'utf8'})
            );
            const {repository, branch} = config;
            const projectName = repository
                .split('/')
                .pop()
                .match(/(.+).git/)[1];
            const projectPath = path.join(protoPath, projectName);
            fs.pathExistsSync(projectPath)
                ? shell.exec(`git checkout -f ${branch} && git pull`, {
                    cwd: projectPath,
                })
                : shell.exec(`git clone -b ${branch} ${repository}`, {
                    cwd: protoPath,
                });
            resolve(projectPath);
        } catch (e) {
            reject(e);
        }
    });
}
