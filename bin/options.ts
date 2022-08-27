import {Option} from "commander";

let DirOption = new Option('-d, --dir <string>', 'the directory of the protobuf files').default('.');

let PortOption = new Option('-p, --port <number>', 'the port for the mock server').default(3333).env('PB_MOCK_PORT');

let IncludeOption = new Option('-i, --include <string>',
    'serve for specific protobuf interface, multiple packages split by ",", ' +
    'such as: "packageName.serviceName.methodName"').default('');

let OutputPathOption = new Option('-o, --output <string>', 'output path for result').default('.');

let FileNameOption = new Option('-n --name <string>', 'output file name for result').default('output.json');

module.exports = {DirOption, PortOption, IncludeOption, OutputPathOption: OutputPathOption, FileNameOption};
