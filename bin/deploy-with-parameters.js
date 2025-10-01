#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const cdkArgs = [];

const separatorIndex = args.indexOf('--');
const optionArgs = separatorIndex === -1 ? args : args.slice(0, separatorIndex);
if (separatorIndex !== -1) {
  cdkArgs.push(...args.slice(separatorIndex + 1));
}

let configPath;
for (let i = 0; i < optionArgs.length; i += 1) {
  const arg = optionArgs[i];
  if (arg === '--config' || arg === '-c') {
    const next = optionArgs[i + 1];
    if (!next) {
      console.error('Expected a file path after --config/-c.');
      process.exit(1);
    }
    configPath = next;
    i += 1;
  } else if (arg.trim() !== '') {
    console.error(`Unknown option: ${arg}`);
    process.exit(1);
  }
}

const resolvedConfigPath = path.resolve(
  process.cwd(),
  configPath ?? path.join('config', 'atlas-parameters.json'),
);

if (!fs.existsSync(resolvedConfigPath)) {
  console.error(
    `Parameter file not found at ${resolvedConfigPath}.\n` +
      'Copy config/atlas-parameters.example.json to config/atlas-parameters.json and update the values, or pass a custom file with --config.',
  );
  process.exit(1);
}

let fileBuffer;
try {
  fileBuffer = fs.readFileSync(resolvedConfigPath, 'utf8');
} catch (error) {
  console.error(`Failed to read parameter file at ${resolvedConfigPath}.`, error);
  process.exit(1);
}

let parameterObject;
try {
  parameterObject = JSON.parse(fileBuffer);
} catch (error) {
  console.error('The parameter file must contain valid JSON.', error);
  process.exit(1);
}

if (parameterObject === null || Array.isArray(parameterObject) || typeof parameterObject !== 'object') {
  console.error('The parameter file must define a JSON object of key/value pairs.');
  process.exit(1);
}

const parameterArgs = [];
for (const [key, rawValue] of Object.entries(parameterObject)) {
  if (key.startsWith('_')) {
    continue; // ignore metadata entries such as _instructions
  }

  if (rawValue === undefined || rawValue === null) {
    console.error(`Parameter "${key}" is undefined in ${resolvedConfigPath}.`);
    process.exit(1);
  }

  let value;
  if (Array.isArray(rawValue)) {
    value = rawValue.join(',');
  } else if (typeof rawValue === 'boolean') {
    value = rawValue ? 'true' : 'false';
  } else {
    value = String(rawValue);
  }

  parameterArgs.push('--parameters', `${key}=${value}`);
}

if (parameterArgs.length === 0) {
  console.error('No deployable parameters found in the provided file.');
  process.exit(1);
}

console.log(`Deploying with parameters from ${resolvedConfigPath}`);

const deployArgs = ['cdk', 'deploy', ...parameterArgs, ...cdkArgs];
const result = spawnSync('npx', deployArgs, { stdio: 'inherit' });

if (result.error) {
  console.error('Failed to execute cdk deploy via npx.', result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
