const os = require('os');
const { spawn } = require('child_process');
const path = require('path');

const binPath = (() => {
  const platform = os.platform();
  if (platform === 'win32') return path.join(__dirname, 'bin', 'win', 'nx-cache-server.exe');
  if (platform === 'linux') return path.join(__dirname, 'bin', 'linux', 'nx-cache-server');
  if (platform === 'darwin') return path.join(__dirname, 'bin', 'mac', 'nx-cache-server');
  throw new Error(`Unsupported platform: ${platform}`);
})();

const proc = spawn(binPath, process.argv.slice(2), {
  stdio: 'inherit'
});

proc.on('exit', process.exit);
