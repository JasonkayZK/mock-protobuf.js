import fs from "fs-extra";

export function parse_configs_sync(config_file?: string): any {

    if (config_file === undefined || config_file === "") {
        return undefined;
    }

    return fs.readJsonSync(config_file);
}
