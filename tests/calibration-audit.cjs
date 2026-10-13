const fs = require('node:fs');
const path = require('node:path');
const { Script } = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../App.jsx'), 'utf8');
const api = new Script(source.slice(source.indexOf('const ENGINE_FAMILIES'), source.indexOf('function Engine3D')) + '\n({ ENGINE_FAMILIES, simulateDyno, peakStats });').runInThisContext();

// These are PR #7's claimed acceptance targets, not independently sourced specifications.
// Production calibration needs exact engine generation, configuration and published references.
const benchmarks = [
  { name: 'LS3 stock-cam / stock-fuel catalog configuration', build: { family: 'ls', ...api.ENGINE_FAMILIES.ls.defaultBuild, cam: 'c_stock', fuel: 'f_stock' }, claimedHp: 430 },
  { name: 'Coyote default stock catalog configuration', build: { family: 'coyote', ...api.ENGINE_FAMILIES.coyote.defaultBuild }, claimedHp: 420 },
];
let failed = false;
for (const benchmark of benchmarks) {
  const actual = api.peakStats(api.simulateDyno(benchmark.build)).hp;
  const error = Math.abs(actual - benchmark.claimedHp) / benchmark.claimedHp;
  const passes = error <= 0.10;
  failed ||= !passes;
  console.log(`${passes ? 'PASS' : 'BLOCKER'}: ${benchmark.name}: ${actual} hp vs PR claim ~${benchmark.claimedHp} hp (${(error * 100).toFixed(1)}% difference)`);
}
process.exitCode = failed ? 1 : 0;
