import {getMockTpl, loadProtobufDefinition} from "../libs/mock";
import mockjs from "mockjs";
import protobuf, {Message, Namespace, Type} from "protobufjs";
import fs from 'fs-extra';
import path from "path";

interface GenerateCmdOptions {

    dir: string;

    include?: string | undefined;

    exclude?: string | undefined;

    output: string;
}

// ProtobufMessageFilter packageName.serviceName.messageName
type ProtobufMessageFilter = Map<string, boolean>;

interface ProtobufMessage {
    packageName: string;
    messageName: string;
}

module.exports = (options: GenerateCmdOptions) => {
    console.log(options);

    // Step 1: Load protobuf definitions
    let pkgDefinition = loadProtobufDefinition(options.dir);

    // Step 2: Filter if necessary
    let filteredMessages = filterMethodAndMessage(pkgDefinition, ...getProtobufFiltersFromOptions(options.include, options.exclude));

    // Step 3: Generate each messages
    filteredMessages.forEach((v: ProtobufMessage[]) => {
        // Step 3.2: Generate mocked protobuf message data
        for (let protobufMessage of v) {
            let mockTpl = getMockTpl(pkgDefinition, "demo", "DemoResponse", undefined);
            let mockData = mockjs.mock(mockTpl);
            console.log(mockData);
            processMockData(options.output, protobufMessage, mockData);
        }
    });
}

function getProtobufFiltersFromOptions(includes?: string | undefined, excludes?: string | undefined):
    [ProtobufMessageFilter | undefined, ProtobufMessageFilter | undefined] {

    return [undefined, undefined];
}

// Filter the protobuf definitions
function filterMethodAndMessage(
    pbDefinitions: protobuf.Root[],
    includeFilters: ProtobufMessageFilter | undefined,
    excludeFilters: ProtobufMessageFilter | undefined,
): Map<string, ProtobufMessage[]> {

    let retMaps = new Map<string, ProtobufMessage[]>();
    for (let pbDefinition of pbDefinitions) {
        if (pbDefinition instanceof Namespace) {
            handleNamespace(pbDefinition.name, pbDefinition as Namespace, includeFilters, excludeFilters, retMaps);
            console.log(retMaps);
        }
    }

    return retMaps;
}

function handleNamespace(namespace: string, pbDefinition: Namespace,
                         includeFilters: ProtobufMessageFilter | undefined,
                         excludeFilters: ProtobufMessageFilter | undefined,
                         retMaps: Map<string, ProtobufMessage[]>) {

    if (filterProtobuf(namespace, includeFilters, excludeFilters)) {
        return new Map;
    }

    for (let i = 0; i < pbDefinition.nestedArray.length; i++) {
        let item = pbDefinition.nestedArray[i];

        if (item instanceof Type) {
            console.log(`message type: \n${item}`);
            if (retMaps.has(namespace)) {
                retMaps.get(namespace)!.push({packageName: namespace, messageName: item.name});
            } else {
                retMaps.set(namespace, [{packageName: namespace, messageName: item.name}]);
            }
        } else if (item instanceof Namespace) {
            handleNamespace(namespace === "" ? item.name : namespace + "." + item.name, item, includeFilters, excludeFilters, retMaps);
        }
    }

    return retMaps;
}

function filterProtobuf(namespace: string, includeFilters: ProtobufMessageFilter | undefined,
                        excludeFilters: ProtobufMessageFilter | undefined): boolean {

    return false
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
