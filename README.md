# **Mock Protobuf**

A command-line tool to mock protobuf!

<br/>

## **Table of Contents**

* [Install](#install)
* [Usage](#usage)
    * [Generate Mock Data](#generate-mock-data)
    * [Mock Server](#mock-server)
        * [Mock Server Data](#mock-server-data)
* [Filter](#filter)
    * [Include Filter](#include-filter)
    * [Exclude Filter](#exclude-filter)
* [Known Issue](#known-issue)

<br/>

## **Install**

It’s handy to just use npm to install this tool:

```bash
npm i mock-pb-cli@latest -g
```

Or, you can build the source code on your own:

```bash
# Clone this repo
git clone git@github.com:JasonkayZK/mock-protobuf.js.git

# Install dependencies
npm i

# Compile the code
npm run c

# Install
npm i -g --force
```

<br/>

## **Usage**

Press `mock-pb -h` to get help:

```bash
$ mock-pb -h

Usage: mock-protobuf [options] [command]

A tool to mock protobuf

Options:
  -v, --version         output the version number
  -h, --help            display help for command

Commands:
  s|serve [options]     Create a mock server for the given protobuf
  g|generate [options]  Generate mock data for the given protobuf
  help [command]        display help for command
```

Their are two sub commands to mock:

-   Generate json mock data: `mock-pb g` or `mock-pb generate`；
-   Generate mock server：`mock-pb s` or `mock-pb serve`；



### **Generate Mock Data**

The `generate` subcommand is used to generate the json mock data from proto.

For example:

```bash
$ mock-pb g
```

The command above will mock all the protobuf files under the current work directory (aka `.`)  and print all the mock data to the terminal:

```
Mocked demo.BasicResponse:
{
    "status": 902735693509892,
    "message": "Vmucue hqxllqx oiloapzwp.",
    "resp": {}
}

Mocked demo.DemoRequest:
{
    "data": "Kqr gxxq."
}

Mocked demo.DemoResponse:
{
    "resp": {
        "status": -6061376970430480,
        "message": "Xpjzjyxrcq eqkmytjo.",
        "resp": {}
    },
    "resp_data": "Ryogd tswayqjsf."
}
```

>   **The default searching protobuf files path is set to `.`, you can use `-d` to change it!**
>
>   **Such as:**
>
>   -   `mock-pb g -d ../test/proto`

<br/>

#### **Output Directory**

It’s easy to use `-o` the `output` the mock data to and directory:

```bash
$ mock-pb g -o ./mock-pb-output
```

And all the mock data will be output under `mock-pb-output/`:

```bash
$ tree
.
├── demo
│   ├── BasicResponse.json
│   ├── DemoRequest.json
│   └── DemoResponse.json
├── google.api
│   ├── CustomHttpPattern.json
│   ├── HttpBody.json
│   ├── Http.json
│   └── HttpRule.json
└── google.protobuf
    ├── Any.json
    ├── Api.json
		......
    ├── SourceContext.json
    ├── Type.json
    └── UninterpretedOption.json
```

The output directory is based on the protobuf `package`；

<br/>

### **Mock Server**

Instead of generating the mock json data, you can also start a mock server locally to mock the whole service!

It’s easy to start a mock server:

```bash
$ mock-pb s
```

The command above will mock all the protobuf files under the current work directory (aka `.`)  and mock the methods under the service:

```bash
Handling routePath: /Demo
Handling routePath: /demo/DemoServiceAnotherDemo
restify listening at http://[::]:3333
```

>   **The default port is `3333`, you can use `-p` to change the server’s port:**
>
>   -   `mock-pb s -p 13333`

It will print the handling route path when starting the server.

When you defined the method’s route path via `google.api.http`, the server will use this path, such as:

```bash
service DemoService {
  rpc Demo(DemoRequest) returns (DemoResponse) {
    option (google.api.http) = {
      post: "/Demo"
      body: "*"
    };
  }
}
```

If not, the route path will be generated as `{/{ProtobufPackageName}/{ProtobufMethodName}`, such as:

```bash
service DemoService {
  rpc AnotherDemo(AnotherDemoRequest) returns (AnotherDemoResponse) {
  }
}
```

When serve is started, it’s easy to test:

```bash
$ curl localhost:3333/Demo
{"resp":{"status":8107764027207864,"message":"Vcinpb troqo neffhj ylve.","resp":{}},"resp_data":"Gpwsl nfq yvkyajlyk."}

$ curl localhost:3333/demo/DemoServiceAnotherDemo
{"resp":{"status":-843357854531144,"message":"Vzby.","resp":{}},"resp_data":"Kvia gfkcggmuo."}
```

<br/>

#### **Mock Server Data**

Sometimes, you don’t want let mock.js generating the mock data, suck as:

```json
{"resp":{"status":-843357854531144,"message":"Vzby.","resp":{}},"resp_data":"Kvia gfkcggmuo."}
```

But you need to let the server **mock the specific response**:

```json
{"resp":{"status":200,"message":"ok"},"resp_data":{"Message":"This is a demo message"}}
```

It’s easy to declare your own mock data:

mock-protobuf.config.json

```json
{
    "ResponseValue": [
        {
            "MethodName": "demo.Demo",
            "Data": {
                "Hello": "world"
            }
        },
        {
            "MethodName": "demo.AnotherDemo",
            "Data": {
                "resp": {
                    "status": 200,
                    "message": "ok"
                },
                "resp_data": {
                    "Message": "This is a demo message"
                }
            }
        }
    ]
}
```

The `MethodName` is the full name of the protobuf method (`package.method`)；

Then use `-c` to declare the config file, such as `-c ./mock-protobuf.config.json`；

The example is below:

```bash
$ npm run dev -- s -i demo -c ./mock-protobuf.config-demo.json
```

Then test:

```bash
$ curl localhost:3333/Demo
{"Hello":"world"}

$ curl localhost:3333/demo/DemoServiceAnotherDemo
{"resp":{"status":200,"message":"ok"},"resp_data":{"Message":"This is a demo message"}}
```

The response has changed!

<br/>

### **Filter**

Sometimes we don’t want to mock all the protobuf definitions. Some some filter is required!

There are two ways to filter:

-   Includes: `-i <string>` or `--include`;
-   Excludes: `-e <string>` or `--exclude`;

**The `<string>` will be built as a `RegExp`, and will be matched as `packageName.serviceName.methodName`;**



#### **Include Filter**

When using `include`, **ONLY the matched data will be mocked**.

For example:

```bash
$ mock-pb g -i demo

Mocked demo.BasicResponse:
{
    "status": -978663427598816,
    "message": "Iymo zomttydmb.",
    "resp": {}
}

Mocked demo.DemoRequest:
{
    "data": "Mdnbfxbvoq khrbwyu sxmkev jss."
}

Mocked demo.DemoResponse:
{
    "resp": {
        "status": 6207610394471496,
        "message": "Dkwse mmhmuhhunb.",
        "resp": {}
    },
    "resp_data": "Fqwkd noiefpr ntjbcfydl."
}

Mocked demo.AnotherDemoRequest:
{
    "name": "Puvujqy kyxl hshuysly.",
    "age": 175838119803604
}

Mocked demo.AnotherDemoResponse:
{
    "resp": {
        "status": -7659482750118844,
        "message": "Fygec kyzysqqga svimupy nbfrjt.",
        "resp": {}
    },
    "resp_data": "Mpgjtjsbr qfspgkb xmpji."
}
```

This will only generate the data that under the `demo.*` package;

For more particular:

```bash
$ mock-pb g -i demo.DemoRequest.*

Mocked demo.DemoRequest:
{
    "data": "Ewqzspj hjkfvvc froqdhkwe fkqsdg dytidwli."
}
```

This will only mock `demo.DemoRequest` message!

<br/>

#### **Exclude Filter**

On the contray, `-e` will remove the matched messages.

For example:

```bash
$ mock-pb g -e demo.*,google.protobuf.* -o mock-pb-gen

$ tree
.
└── google.api
    ├── CustomHttpPattern.json
    ├── HttpBody.json
    ├── Http.json
    └── HttpRule.json
```

This will not mock the message under  `demo.*` and  `google.protobuf.*` package.

When you are using both `include` and `exclude` filter, the `exclude` filter will ALWAYS effect at the first time!

For example:

```bash
$ mock-pb g -i demo -e demo
```

Will generate nothing!

<br/>



## **Known Issue**

Because this tool is depending on [protobuf.js](https://github.com/protobufjs/protobuf.js), some known issues can not be avoid!

-   `Protobuf.js may have trouble parsing the protobuf files when it got comments in it`: according to the issue: [#1799](https://github.com/protobufjs/protobuf.js/issues/1799) or [#1616](https://github.com/protobufjs/protobuf.js/issues/1616) or [#1237](https://github.com/protobufjs/protobuf.js/issues/1237) or …


## **Linked Blog**


- [用TypeScript写了一个Mock-Protobuf的工具](https://jasonkayzk.github.io/2022/10/07/用TypeScript写了一个Mock-Protobuf的工具/)

