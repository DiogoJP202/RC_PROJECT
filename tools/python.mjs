import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const bundled = join(homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'python', process.platform === 'win32' ? 'python.exe' : 'bin/python3');
const candidates = [
  ...(process.env.ATLAS_PYTHON ? [[process.env.ATLAS_PYTHON]] : []),
  ['python'], ['python3'], ...(process.platform === 'win32' ? [['py', '-3']] : []),
  ...(existsSync(bundled) ? [[bundled]] : []),
];
const runtime = candidates.find(([binary, ...prefix]) => spawnSync(binary, [...prefix, '-c', 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)'], { stdio: 'pipe', windowsHide: true }).status === 0);
if (!runtime) {
  process.stderr.write('Python 3 não encontrado. Instale Python 3.10+ ou defina ATLAS_PYTHON com o caminho do executável.\n');
  process.exitCode = 1;
} else {
  const [binary, ...prefix] = runtime;
  const result = spawnSync(binary, [...prefix, '-B', ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  process.exitCode = result.status ?? 1;
}
