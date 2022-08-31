import mockjs, {MockjsRandom} from "mockjs";
import restify, {Next, Request, Response} from "restify";
import {getMethod, getMockTpl, loadProtobufDefinition} from "./mock";
import {ProtobufMessageFilter} from "./filter";

type ResponseHandler = (res: restify.Response, data: any) => void;

interface MockHandlerOptions {
    includeFilters: string,
    excludeFilters: string,
    responseHandler?: ResponseHandler;
    hackMockTpl?: (
        key: string,
        type: string,
        random: MockjsRandom,
    ) => string | (() => string);
}

const generateMockHandler = (
    repository: string,
    options: MockHandlerOptions,
) => {
    const {includeFilters, excludeFilters, responseHandler, hackMockTpl} = options;

    // Step 1: Load protobuf definitions
    const packageDefinition = loadProtobufDefinition(repository);

    // return (req: Request, res: Response, next: Next) => {
    //     const method = getMethod(
    //         packageDefinition,
    //         packageName,
    //         serviceName,
    //         methodName,
    //     );
    //     const responseType = method?.responseType || "";
    //     const tpl = getMockTpl(
    //         packageDefinition,
    //         packageName,
    //         responseType,
    //         hackMockTpl,
    //     );
    //     const mockData = mockjs.mock(tpl);
    //     responseHandler ? responseHandler(res, mockData) : res.json(mockData);
    //     next();
    // };
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
    const handler = generateMockHandler(protobufRepoPath, options);

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
    // server.get("*", handler);
    // server.post("*", handler);
    return {
        start: (port: number = 3333) =>
            server.listen(port, () =>
                console.log("%s listening at %s", server.name, server.url),
            ),
    };
};
