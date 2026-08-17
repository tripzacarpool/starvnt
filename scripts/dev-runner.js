#!/usr/bin/env node
const { spawn } = require('child_process');

const procs = [];
const frontendUrl = 'http://localhost:5173';

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
