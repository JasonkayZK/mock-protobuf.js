import mockjs, {MockjsRandom} from "mockjs";
import restify, {Next, Request, RequestHandlerType, Response} from "restify";
import {getMethod, getMockTpl, loadProtobufDefinition} from "./mock";
import {filterProtobufDefinitions, getProtobufFiltersFromOptions, ProtobufMessage,} from "./filter";
import {Method} from "protobufjs";
import {parse_configs_sync} from "./configs";

interface MockHandlerOptions {
    include: string,
    exclude: string,
    responseHandlerMap?: Map<string, ResponseHandler>;
    hackMockTpl?: (
        key: string,
        type: string,
        random: MockjsRandom,
    ) => string | (() => string);
}

type ResponseHandler = (resp: restify.Response, data: any) => void;

function generateMockHandlersMap(
    repository: string,
    options: MockHandlerOptions,
): Map<string, RequestHandlerType> {
    const {include, exclude, responseHandlerMap, hackMockTpl} = options;

    // Step 1: Load protobuf definitions
    const pkgDefinition = loadProtobufDefinition(repository);

    // Step 2: Filter if necessary
    let [_, __, filteredMethodsMap] = filterProtobufDefinitions(pkgDefinition, ...getProtobufFiltersFromOptions(include, exclude));
    // console.log(`filteredMethodsMap: ${filteredMethodsMap}`);

    // Step 3: Bind methods to the mock server handler
    let retHandlersMap: Map<string, RequestHandlerType> = new Map;
    filteredMethodsMap.forEach((v: ProtobufMessage[]) => {

        // Step 3.1: Generate each handler from protobuf method data
        for (let protobufMethod of v) {
            // console.log(`protobufMethod: ${protobufMethod}`);
            let methodFullName = `${protobufMethod.packageName}.${protobufMethod.data.name}`;

            let handler = (req: Request, res: Response, next: Next) => {
                const method = getMethod(
                    pkgDefinition,
                    protobufMethod.packageName,
                    protobufMethod.serviceName,
                    protobufMethod.data.name,
                );
                const responseType = method?.responseType || "";
                const tpl = getMockTpl(
                    pkgDefinition,
                    protobufMethod.packageName,
                    responseType,
                    new Map(),
                    hackMockTpl,
                );
                const mockData = mockjs.mock(tpl);

                let customHandler = responseHandlerMap?.get(methodFullName);
                if (customHandler !== undefined) { // CustomHandler response handler
                    customHandler(res, mockData);
                } else { // We mock it
                    // console.log(mockData);
                    res.json(mockData)
                }

                next();
            };
            retHandlersMap.set(getRouthPath(protobufMethod.packageName,
                protobufMethod.serviceName,
                <Method>protobufMethod.data), handler);
        }
    });

    return retHandlersMap;
}

function getRouthPath(packageName: string, serviceName: string, method: Method): string {

    let parsedRouthPath = getRouthPathFromOptions(method);
    if (parsedRouthPath === "") {
        parsedRouthPath = `/${packageName.replace('.', '/')}` +
            `/${serviceName.replace('.', '/')}` +
            `${method.name}`;
    }
    return parsedRouthPath;
}

function getRouthPathFromOptions(method: Method): string {

    for (let reqType of ["get", "post"]) {
        let option = method.getOption(`(google.api.http).${reqType}`);
        if (option !== undefined) {
            return <string>option;
        }
    }
    return "";
}

function handleEachResponseValue(responseValue: any, map: Map<string, ResponseHandler>) {

    if (responseValue.hasOwnProperty("MessageName") &&
        typeof responseValue.MessageName === 'string' &&
        responseValue.hasOwnProperty("Data")) {

        map.set(responseValue.MessageName, (resp: restify.Response, _: any) => {
            resp.json(responseValue.Data);
        });
    }

}

export function parse_response_value_from_config(config_file?: string): Map<string, ResponseHandler> | undefined {

    let configs = parse_configs_sync(config_file);
    if (configs === undefined) {
        return undefined;
    }

    let retMap = new Map<string, ResponseHandler>();
    if (configs.hasOwnProperty("ResponseValue") && configs.ResponseValue instanceof Array) {
        let responseValueArr = <Array<any>>configs.ResponseValue;
        for (let responseValue of responseValueArr) {
            handleEachResponseValue(responseValue, retMap);
        }
    }

    return retMap;
}

export const createServer = async (protobufRepoPath: string, options: MockHandlerOptions) => {
    const server = restify.createServer();

    // CORS
    server.use((req: Request, res: Response, next: Next) => {
        res.header("Access-Control-Allow-Credentials", true);
        res.header("Access-Control-Allow-Origin", req.headers.origin);
        next();
    });

    // HANDLER
    const handlersMap = generateMockHandlersMap(protobufRepoPath, options);

    // API ROUTES
    server.opts("*", (req, res, next) => {
        res.header(
            "Access-Control-Allow-Methods",
            req.headers["access-control-request-methods"],
        );
        res.header(
            "Access-Control-Allow-Headers",
            req.headers["access-control-request-headers"],
        );
        res.end();
        next();
    });
    handlersMap.forEach((handler, routePath) => {
        console.log(`Handling routePath: ${routePath}`)
        server.get(routePath, handler);
        server.post(routePath, handler);
    })

    return {
        start: (port: number = 3333) =>
            server.listen(port, () =>
                console.log("%s listening at %s", server.name, server.url),
            ),
    };
};
