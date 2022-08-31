import mockjs, {MockjsRandom} from "mockjs";
import restify, {Next, Request, RequestHandlerType, Response} from "restify";
import {getMethod, getMockTpl, loadProtobufDefinition} from "./mock";
import {
    filterProtobufDefinitions,
    getProtobufFiltersFromOptions,
    ProtobufMessage,
} from "./filter";

interface MockHandlerOptions {
    include: string,
    exclude: string,
    responseHandler?: ResponseHandler;
    hackMockTpl?: (
        key: string,
        type: string,
        random: MockjsRandom,
    ) => string | (() => string);
}

type ResponseHandler = (res: restify.Response, data: any) => void;

const generateMockHandler = (
    repository: string,
    options: MockHandlerOptions,
): RequestHandlerType[] => {
    const {include, exclude, responseHandler, hackMockTpl} = options;

    // Step 1: Load protobuf definitions
    const pkgDefinition = loadProtobufDefinition(repository);

    // Step 2: Filter if necessary
    let [_, __, filteredMethodsMap] = filterProtobufDefinitions(pkgDefinition, ...getProtobufFiltersFromOptions(include, exclude));

    // Step 3: Bind methods to the mock server handler
    let retHandlers: RequestHandlerType[] = [];
    filteredMethodsMap.forEach((v: ProtobufMessage[]) => {
        // Step 3.2: Generate each handler from protobuf method data
        for (let protobufMethods of v) {
            let mockTpl = getMockTpl(pkgDefinition, "demo", "DemoResponse", undefined);
            let mockData = mockjs.mock(mockTpl);
            console.log(`mockData: ${mockData}`);
            // processMockData(options.output, protobufMethods, mockData);
        }
    });

    return retHandlers;
//     return (req: Request, res: Response, next: Next) => {
//         const method = getMethod(
//             packageDefinition,
//             packageName,
//             serviceName,
//             methodName,
//         );
//         const responseType = method?.responseType || "";
//         const tpl = getMockTpl(
//             packageDefinition,
//             packageName,
//             responseType,
//             hackMockTpl,
//         );
//         const mockData = mockjs.mock(tpl);
//         responseHandler ? responseHandler(res, mockData) : res.json(mockData);
//         next();
//     };
};

export const createServer = async (protobufRepoPath: string, options: MockHandlerOptions) => {
    const server = restify.createServer();

    // CORS
    server.use((req: Request, res: Response, next: Next) => {
        res.header("Access-Control-Allow-Credentials", true);
        res.header("Access-Control-Allow-Origin", req.headers.origin);
        next();
    });

    // HANDLER
    const handlers = generateMockHandler(protobufRepoPath, options);

    // PAGE ROUTES
    server.get("/", (req: Request, res: Response, next: Next) => {
        res.end("<h1>Mock server in running !</h1>");
        next();
    });

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
    // server.get("*", handlers);
    // server.post("*", handlers);
    return {
        start: (port: number = 3333) =>
            server.listen(port, () =>
                console.log("%s listening at %s", server.name, server.url),
            ),
    };
};
