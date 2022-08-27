#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const {Command} = require('commander');
const {DirOption, IncludeOption, PortOption, OutputPathOption, FileNameOption} = require('./options')
const generate = require('../src/commands/generate');
const serve = require('../src/commands/serve');

const program = new Command();

let config = {};
// 配置文件如果存在则读取
if (fs.existsSync(path.resolve("mock-protobuf.config.json"))) {
    config = path.resolve("mock-protobuf.config.json");
}

program
    .name("mock-protobuf")
    .version("1.0.0", "-v, --version")
    .description("A tool to mock protobuf");

program.command('s').alias('serve')
    .addOption(PortOption)
    .addOption(DirOption)
    .addOption(IncludeOption)
    .action(serve).description("Create a mock server for the given protobuf");

program.command('g').alias('generate')
    .addOption(DirOption)
    .addOption(IncludeOption)
    .addOption(OutputPathOption)
    .addOption(FileNameOption)
    .action(generate).description("Generate mock data for the given protobuf");

program.parse();
