import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTrackerConnection, isLegacyDemoUrl, normalizeBaseUrl } from '../src/config.js';

const demo = 'https://ca491042a4a2e9cd0092.free.beeceptor.com';
const mock = 'https://project-id.mockapi.io/api/v1';

test('new installs use a normalized configured tracker but never the expiring public demo', () => {
  assert.equal(getTrackerConnection(null, mock + '/').baseUrl, mock);
  assert.equal(getTrackerConnection(null, demo + '/').baseUrl, '');
  assert.equal(getTrackerConnection(null).baseUrl, '');
});

test('saved choices survive a new default, including the old demo and explicit disconnect', () => {
  for (const saved of [demo, '', 'https://another.mockapi.io/v2']) {
    const settings = getTrackerConnection(saved, mock);
    assert.equal(settings.baseUrl, saved);
    assert.equal(settings.defaultUrl, mock);
  }
});

test('a bad build default leaves an existing connection usable and reports a safe error', () => {
  for (const configured of ['https://YOUR_PROJECT.mockapi.io/api/v1', 'https://user:secret@example.test', 'invalid']) {
    const settings = getTrackerConnection(mock, configured);
    assert.equal(settings.baseUrl, mock);
    assert.equal(settings.defaultUrl, '');
    assert.ok(settings.configurationError);
    assert.ok(!settings.configurationError.includes('secret'));
    assert.equal(getTrackerConnection(null, configured).baseUrl, '');
  }
});

test('only the historical demo is retired; other provider endpoints remain supported', () => {
  assert.ok(isLegacyDemoUrl(demo + '/'));
  for (const url of [mock, 'https://personal.free.beeceptor.com', demo + '.example.test']) {
    assert.equal(isLegacyDemoUrl(url), false);
    assert.equal(getTrackerConnection(null, url).baseUrl, url);
  }
});

test('connection input rejects placeholders, resource URLs and embedded credentials', () => {
  for (const url of ['https://your-project.mockapi.io/api/v1', mock + '/entries/', mock + '/lists', mock + '?key=secret', mock + '#secret', 'http://example.test', 'https://user:secret@example.test']) {
    assert.throws(() => normalizeBaseUrl(url));
  }
  assert.equal(normalizeBaseUrl(' ' + mock + '/// '), mock);
});
