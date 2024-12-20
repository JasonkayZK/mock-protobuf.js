import {createServer, parse_response_value_from_config} from "../libs/server";

interface ServeCmdOptions {

    dir: string;

    include: string;

    exclude: string;

    port: number | undefined;

    config: string;

    import?: string | undefined;
}

module.exports = function (options: ServeCmdOptions) {
    // console.log(options);

    createServer(options.dir, {
        include: options.include,
        exclude: options.exclude,
        import: options.import,
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
        responseHandlerMap: parse_response_value_from_config(options.config),
        hackMockTpl: (key, type, random) => {
            key = key.toLowerCase();
            const keyTypeHas = (k: string, t: string) =>
                type === t && key.indexOf(k) > -1;
            if (keyTypeHas('icon', 'string')) return '@image';
            else if (keyTypeHas('name', 'string')) return '@name';
            return '';
        }
    }).then(server => server.start(options.port));

}
