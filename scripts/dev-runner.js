#!/usr/bin/env node
const { existsSync } = require('fs');
const { spawn, spawnSync } = require('child_process');

const procs = [];
const frontendUrl = 'http://localhost:5173';

ensureDependencies();

function start(name, args) {
  console.log(`Starting ${name}: npm ${args.join(' ')}`);
  const p = spawn('npm', args, { stdio: 'inherit', shell: true });
  procs.push(p);
  p.on('exit', (code, signal) => {
    console.log(`${name} exited with ${code ?? signal}`);
  });
  p.on('error', (err) => {
    console.error(`${name} failed:`, err);
  });
  return p;
}

start('backend', ['--workspace', 'backend', 'run', 'dev']);
start('frontend', ['--workspace', 'frontend', 'run', 'dev']);

setTimeout(() => {
  openBrowser(frontendUrl);
}, 2500);

function shutdown() {
  console.log('Shutting down child processes...');
  procs.forEach((p) => {
    try {
      p.kill('SIGINT');
    } catch (e) {
      // ignore
    }
  });
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function ensureDependencies() {
  if (existsSync('node_modules')) return;

  console.log('node_modules not found. Installing dependencies first...');
  const install = spawnSync('npm', ['install'], {
    stdio: 'inherit',
    shell: true
  });

  if (install.status !== 0) {
    console.error('Dependency install failed. Please run npm install manually.');
    process.exit(install.status ?? 1);
  }
}

function openBrowser(url) {
  const command =
    process.platform === 'win32'
      ? 'cmd'
      : process.platform === 'darwin'
        ? 'open'
        : 'xdg-open';
  const args =
    process.platform === 'win32'
      ? ['/c', 'start', '', url]
      : [url];

  const opener = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    shell: false
  });
  opener.unref();
  console.log(`Opening ${url}`);
}
