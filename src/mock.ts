import path from 'path';
import globby from 'globby';
import shell from 'shelljs';
import protobuf from 'protobufjs';
import { Random, MockjsRandom } from 'mockjs';

interface MethodObject {
    requestType: string;
    responseType: string;
}

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
    string: '@sentence',
    bytes: '@sentence',
};

export function initPackageDefinition(repository: string) {
    const absFilePaths = path.join(repository, '**/*.proto');
    // 启动时读取目录下所有proto文件
    const protosPaths = globby.sync([absFilePaths]);
    // 处理proto文件 兼容注释造成的语义分析错误
    shell.sed('-i', /\/\*\/\//g, '/* //', protosPaths);
    const packageDefinition = protosPaths.map(protosPath => {
        const root = new protobuf.Root();
        return root.loadSync(protosPath, { keepCase: true });
    });
    return packageDefinition;
}

export function getMethod(
    packageDefinition: protobuf.Root[],
    packageName: string,
    serviceName: string,
    methodName: string
): MethodObject | undefined {
    const service = packageDefinition.find(pd => {
        try {
            pd.lookupService(`${packageName}.${serviceName}`);
            return true;
        } catch {
            return false;
        }
    });
    return service?.lookup(methodName)?.toJSON() as MethodObject;
}

export function getMessage(
    packageDefinition: protobuf.Root[],
    packageName: string,
    messageName: string
): protobuf.Type | undefined {
    return packageDefinition
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
    packageDefinition: protobuf.Root[],
    packageName: string,
    messageType: string,
    hackMockTpl?: (
        key: string,
        type: string,
        random: MockjsRandom
    ) => string | (() => string)
) {
    const messageTypeSplit = messageType.split('.');
    if (messageTypeSplit.length) {
        messageType = messageTypeSplit.pop()!;
        packageName = messageTypeSplit.join('.');
    }
    const message = getMessage(packageDefinition, packageName, messageType);
    const fields = message?.fields || {};
    const keys = Object.keys(fields);
    const tpl: { [key: string]: any } = {};
    keys.forEach(key => {
        const val = fields[key];
        const { repeated, type } = val;
        const mockTpl =
            (hackMockTpl && hackMockTpl(key, type, Random)) || TYPES[type];
        key = `${key}${repeated ? '|0-10' : ''}`;
        if (mockTpl) {
            tpl[key] = repeated ? [mockTpl] : mockTpl;
        } else {
            const recursiveMockTpl = getMockTpl(
                packageDefinition,
                packageName,
                type,
                hackMockTpl
            );
            tpl[key] = repeated ? [recursiveMockTpl] : recursiveMockTpl;
        }
    });
    return tpl;
}
