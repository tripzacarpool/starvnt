#!/usr/bin/env node
const { spawn } = require('child_process');

const procs = [];

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
