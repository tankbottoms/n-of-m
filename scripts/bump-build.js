#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'build-number.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
data.build += 1;
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

const pkg = require(path.join(__dirname, '..', 'package.json'));
console.log(`v${pkg.version} build ${data.build}`);
