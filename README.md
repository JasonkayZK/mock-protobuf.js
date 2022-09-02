# **Mock Protobuf**

A repository to mock json output from protobuf.



## **Install**

It’s handy to just use npm to install this tool:

```bash
npm i mock-pb-cli -g
```

or, you can build the source code on your own:

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

The `generate` subcommand is used to generate the json mock data from proto：

```bash

```











### **Mock Server**





## **Known Issue**







