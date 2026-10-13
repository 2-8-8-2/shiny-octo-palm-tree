const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Script } = require('node:vm');

// Execute the actual catalog and logic from the shipped single-file app.
const source = readFileSync(resolve(__dirname, '../App.jsx'), 'utf8');
const start = source.indexOf('const ENGINE_FAMILIES');
const end = source.indexOf('function Engine3D');
assert.ok(start >= 0 && end > start, 'Application logic boundaries must exist');
const api = new Script(source.slice(start, end) + '\n({ ENGINE_FAMILIES, getCatalog, sanitizeBuild, hasConsistentDisplacement, checkCompatibility, simulateDyno, peakStats, combineDynoCurves, getShopUrl });').runInThisContext();
const defaults = family => ({ family, ...api.ENGINE_FAMILIES[family].defaultBuild });

test('Corrupt saved builds normalize to usable defaults', () => {
  for (const raw of [null, [], 'bad', { family: 'unknown' }, { family: 'constructor' }]) {
    const build = api.sanitizeBuild(raw);
    assert.equal(build.family, 'ls');
    assert.ok(api.simulateDyno(build).length);
  }
});

test('Saved builds reject cross-family parts and preserve valid selections and ID', () => {
  const build = api.sanitizeBuild({ family: 'coyote', block: 'b_ls3', heads: 'h_ls3', fuel: 'cy_f_pi', id: 42, name: 'Garage build' });
  assert.equal(build.block, 'cy_b_stock');
  assert.equal(build.heads, 'cy_h_stock');
  assert.equal(build.fuel, 'cy_f_pi');
  assert.equal(build.id, 42);
  assert.equal(build.name, 'Garage build');
  assert.ok(api.simulateDyno(build).length);
});

test('Unknown saved fields do not overwrite derived state', () => {
  const build = api.sanitizeBuild({ ...defaults('ls'), _estPower: 9999, peakHp: 9999, cost: -50, name: 25 });
  assert.equal(build._estPower, undefined);
  assert.equal(build.name, 'My LS Build');
  assert.equal(build.peakHp, api.peakStats(api.simulateDyno(build)).hp);
  assert.ok(build.cost > 0);
});

test('Known inconsistent Coyote blocks cannot produce a power estimate', () => {
  for (const block of ['cy_b_363', 'cy_b_408']) {
    const build = { ...defaults('coyote'), block };
    assert.ok(api.checkCompatibility(build).some(issue => issue.severity === 'error' && issue.message.includes('displacement')));
    assert.deepEqual(api.simulateDyno(build), []);
  }
});

test('Default blocks have consistent V8 geometry within rounding tolerance', () => {
  for (const family of Object.keys(api.ENGINE_FAMILIES)) {
    const block = api.getCatalog(family).block.find(part => part.id === defaults(family).block);
    assert.equal(api.hasConsistentDisplacement(block), true);
  }
});

test('Incompatible intake or unknown selection suppresses estimates', () => {
  for (const build of [{ ...defaults('ls'), intake: 'i_stock_truck' }, { ...defaults('ls'), cam: 'unknown' }]) {
    assert.ok(api.checkCompatibility(build).some(issue => issue.severity === 'error'));
    assert.deepEqual(api.simulateDyno(build), []);
  }
});

test('All default curves are finite and obey HP = torque × RPM / 5252', () => {
  for (const family of Object.keys(api.ENGINE_FAMILIES)) {
    const curve = api.simulateDyno(defaults(family));
    assert.ok(curve.length > 0);
    for (const point of curve) {
      assert.ok(Number.isFinite(point.hp) && Number.isFinite(point.tq));
      assert.ok(point.hp >= 0 && point.tq >= 0);
      assert.ok(Math.abs(point.hp - point.tq * point.rpm / 5252) < 1.5);
    }
  }
});

test('Comparison curves match by RPM rather than position', () => {
  const data = api.combineDynoCurves([{ rpm: 1500, hp: 20 }, { rpm: 2000, hp: 30 }], [{ rpm: 2000, hp: 50, tq: 131 }]);
  assert.equal(data[0].hp_b, undefined);
  assert.equal(data[1].hp_b, 50);
});

test('Retailer links preserve encoded queries and reject invalid inputs', () => {
  for (const retailer of ['jegs', 'summit']) {
    const query = 'LS block & heads #1';
    const url = new URL(api.getShopUrl(retailer, query));
    assert.equal(url.protocol, 'https:');
    assert.equal(url.searchParams.get(retailer === 'jegs' ? 'Ntt' : 'keyword'), query);
  }
  assert.throws(() => api.getShopUrl('unknown', 'LS'));
  assert.throws(() => api.getShopUrl('jegs', ' '));
});

test('427 LSX search does not send buyers to a 454R engine', () => {
  const part = api.getCatalog('ls').block.find(part => part.id === 'b_lsx');
  assert.ok(!part.shopSearch.includes('454'));
});
