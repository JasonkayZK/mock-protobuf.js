import {Option} from "commander";
import {createServer} from "../libs";

module.exports = function (options: Option[]) {
    console.log(options);

    createServer({
        /*
          The param req is a Restify Request entity
          http://restify.com/docs/request-api/#request
        */
        getConfigHandler: req => {
            /*
              according to your api route
              should return packageName, serviceName and method according to the request entity
              eg. API Route Config /:package_name/:service_name/:method_name
                  Request Path /coderge.demo/ReadmeService/CopyText
            */
            return {
                packageName: req.params['package_name'], // 'coderge.demo',
                serviceName: req.params['service_name'], // 'ReadmeService',
                methodName: req.params['method_name'] // 'CopyText'
            };
        },
        /*
          The param data is result of mock.js
          https://github.com/nuysoft/Mock
        */
        responseHandler: (res, data) => {
            /*
              Can customize a response
            */
            // res.json(data);
            // res.send(JSON.stringify(data))
            res.json({ msg: 'ok', ret: 0, data });
        },
        /*
          The param data is result of mock.js
          https://github.com/nuysoft/Mock
        */
        /**
         * Hack mock rules of template
         * @param key protobuf message key
         * @param type protobuf message key type (eg. string/int32/bool...)
         * @param random
         */
        hackMockTpl: (key, type, random) => {
            key = key.toLowerCase();
            const keyTypeHas = (k: string, t: string) =>
                type === t && key.indexOf(k) > -1;
            if (keyTypeHas('icon', 'string')) return '@image';
            else if (keyTypeHas('name', 'string')) return '@name';
            return '';
        },
    }).then(server => server.start());

}
