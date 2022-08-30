import {getMockTpl, loadProtobufDefinition} from "../libs/mock";
import mockjs from "mockjs";
import fs from 'fs-extra';
import path from "path";
import {
    filterProtobufDefinitions,
    getProtobufFiltersFromOptions, ProtobufMessage,
} from "../libs/filter";

interface GenerateCmdOptions {

    dir: string;

    include?: string | undefined;

    exclude?: string | undefined;

    output: string;
}

module.exports = (options: GenerateCmdOptions) => {
    console.log(options);

    // Step 1: Load protobuf definitions
    let pkgDefinition = loadProtobufDefinition(options.dir);

    // Step 2: Filter if necessary
    let [filteredMessages, _] = filterProtobufDefinitions(pkgDefinition, ...getProtobufFiltersFromOptions(options.include, options.exclude));

    // Step 3: Generate each messages
    filteredMessages.forEach((v: ProtobufMessage[]) => {
        // Step 3.2: Generate mocked protobuf message data
        for (let protobufMessage of v) {
            let mockTpl = getMockTpl(pkgDefinition, "demo", "DemoResponse", undefined);
            let mockData = mockjs.mock(mockTpl);
            processMockData(options.output, protobufMessage, mockData);
        }
    });
}


function processMockData(outputPath: string, pbMessage: ProtobufMessage, mockedMessageData: any) {
    // Print the mock data to the console if no output path
    if (outputPath.length === 0) {
        console.log(`Mocked ${pbMessage.packageName}.${pbMessage.messageName}: \n${mockedMessageData}`);
        return
    }

    // Else async write the output
    let saveFilePath = path.posix.join(outputPath, pbMessage.packageName);
    fs.ensureDirSync(saveFilePath)
    fs.writeJSON(path.posix.join(saveFilePath, pbMessage.messageName + ".json"), mockedMessageData, err => {
        if (err) return console.error(err)
    })
}
