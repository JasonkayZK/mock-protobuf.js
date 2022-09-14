import {Option} from "commander";

let DirOption = new Option('-d, --dir <string>', 'the directory of the protobuf files').default('.');

let PortOption = new Option('-p, --port <number>', 'the port for the mock server').default(3333).env('PB_MOCK_PORT');

let IncludeOption = new Option('-i, --include <string>',
    'include the specific protobuf interfaces, multiple packages split by ",", ' +
    'such as: "packageName.serviceName.methodName"').default('');

let ExcludeOption = new Option('-e, --exclude <string>',
    'exclude the specific protobuf interfaces, multiple packages split by ",", ' +
    'such as: "packageName.serviceName.methodName"').default('');

let OutputPathOption = new Option('-o, --output <string>', 'output path for result').default('');

let ConfigOption = new Option('-c, --config <string>', 'the config file path').default('mock-protobuf.config.json');

module.exports = {DirOption, PortOption, IncludeOption, ExcludeOption, OutputPathOption, ConfigOption: ConfigOption};
