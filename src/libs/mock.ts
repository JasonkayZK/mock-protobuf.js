import path from 'path';
import globby from 'globby';
import shell from "shelljs";
import protobuf, {Method, Root} from 'protobufjs';
import {MockjsRandom, Random} from 'mockjs';
import { existsSync } from 'fs';
import { getImportPaths, getResolveProtoPathsFunction } from './path';

const TYPES: { [key: string]: string } = {
    double: '@float',
    float: '@float',
    int32: '@integer',
    int64: '@string("1234567890", 1, 20)',
    uint32: '@natural',
    uint64: '@string("1234567890", 1, 20)',
    sint32: '@integer',
    sint64: '@string("1234567890", 1, 20)',
    fixed32: '@natural',
    fixed64: '@string("1234567890", 1, 20)',
    sfixed32: '@integer',
    sfixed64: '@string("1234567890", 1, 20)',
    bool: '@boolean',
    string: '@sentence(1, 5)',
    bytes: '@sentence(1, 5)',
};

export function loadProtobufDefinition(repository: string, importString: string = '') {
    const imports = getImportPaths(importString);

    const absFilePaths = path.posix.join(repository, '**/*.proto');

    // Load all protobuf files under the repository
    const protoPaths = globby.sync([absFilePaths]);

    // Process each protobuf files, and solve semantic analysis errors caused by compatible annotations
    shell.sed('-i', /\/\*\/\//g, '/* //', protoPaths);
    const paths = protoPaths.map(protoPaths => {
      return path.posix.join(process.cwd(), protoPaths);
    });
    return paths.map(protoPaths => {
        const root = new protobuf.Root();
        root.resolvePath = getResolveProtoPathsFunction(imports);
        return root.loadSync(protoPaths, {keepCase: true, alternateCommentMode: false, preferTrailingComment: false});
    });
}

export function getService(
    pbDefinitions: protobuf.Root[],
    packageName: string,
    serviceName: string,
): Root | null | undefined {
    return pbDefinitions.find(pd => {
        try {
            pd.lookupService(`${packageName}.${serviceName}`);
            return true;
        } catch {
            return false;
        }
    });
}

export function getMethod(
    pbDefinitions: protobuf.Root[],
    packageName: string,
    serviceName: string,
    methodName: string
): Method | null | undefined {
    const service = getService(pbDefinitions, packageName, serviceName);
    return service?.lookup(methodName) as Method;
}

export function getMessage(
    pbDefinitions: protobuf.Root[],
    packageName: string,
    messageName: string
): protobuf.Type | undefined {
    return pbDefinitions
        .find(pd => {
            try {
                pd.lookupType(`${packageName}.${messageName}`);
                return true;
            } catch {
                return false;
            }
        })
        ?.lookupType(`${packageName}.${messageName}`);
}

export function getMockTpl(
    pbDefinitions: protobuf.Root[],
    packageName: string,
    messageType: string,
    mockMemo: Map<string, any>, // mockMemo to avoid recursive struct
    hackMockTpl?: (
        key: string,
        type: string,
        random: MockjsRandom
    ) => string | (() => string),
) {
    const messageTypeSplit = messageType.split('.');
    if (messageTypeSplit.length) {
        messageType = messageTypeSplit.pop()!;
        packageName = messageTypeSplit.join('.');
    }
    const message = getMessage(pbDefinitions, packageName, messageType);
    const fields = message?.fields || {};
    const keys = Object.keys(fields);
    const tpl: { [key: string]: any } = {};
    keys.forEach(key => {
        const val = fields[key];
        const {repeated, type} = val;
        const mockTpl =
            (hackMockTpl && hackMockTpl(key, type, Random)) || TYPES[type];
        key = `${key}${repeated ? '|0-10' : ''}`;

        let mockKey = `${packageName}.${messageType}.${key}`;

        if (mockMemo.has(mockKey)) {
            return;
        }

        mockMemo.set(mockKey, tpl); // memorize the key
        if (mockTpl) {
            tpl[key] = repeated ? [mockTpl] : mockTpl;
        } else {
            const recursiveMockTpl = getMockTpl(
                pbDefinitions,
                packageName,
                type,
                mockMemo,
                hackMockTpl
            );
            tpl[key] = repeated ? [recursiveMockTpl] : recursiveMockTpl;
        }
    });
    return tpl;
}
