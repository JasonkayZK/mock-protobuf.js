#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const program = require('commander');

let config = {};
// 配置文件如果存在则读取
if (fs.existsSync(path.resolve("mock-protobuf.config.js"))) {
    config = path.resolve("mock-protobuf.config.js");
}

program.program
    .version("1.0.0", "-v, --version")
    .command("init")
    .description("initialize your meet config");

console.log("执行成功");
