#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const {Command} = require('commander');
const {DirOption, IncludeOption, ExcludeOption, PortOption, OutputPathOption, ConfigOption} = require('./commands/options')
const generate = require('./commands/generate');
const serve = require('./commands/serve');

const program = new Command();

let config = {};
// 配置文件如果存在则读取
if (fs.existsSync(path.resolve("mock-protobuf.config-demo.json"))) {
    config = path.resolve("mock-protobuf.config-demo.json");
}

program
    .name("mock-protobuf")
    .version("v1.1.2", "-v, --version")
    .description("A tool to mock protobuf");

program.command('s').alias('serve')
    .addOption(DirOption)
    .addOption(IncludeOption)
    .addOption(ExcludeOption)
    .addOption(PortOption)
    .addOption(ConfigOption)
    .action(serve).description("Create a mock server for the given protobuf");

program.command('g').alias('generate')
    .addOption(DirOption)
    .addOption(IncludeOption)
    .addOption(ExcludeOption)
    .addOption(OutputPathOption)
    .action(generate).description("Generate mock data for the given protobuf");

program.parse();
