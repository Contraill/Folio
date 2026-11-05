import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fromAcceptLanguage, fromCookie, resolveLocale } from './locale.ts';

const url = (query = '') => new URL(`https://oztozlu.dev/about${query}`);

test('Accept-Language honours q-values and order', () => {
  assert.equal(fromAcceptLanguage('tr-TR,tr;q=0.9,en;q=0.8'), 'tr');
  assert.equal(fromAcceptLanguage('en-US,en;q=0.9,tr;q=0.8'), 'en');
  assert.equal(fromAcceptLanguage('tr;q=0.5, en;q=0.9'), 'en');
  assert.equal(fromAcceptLanguage('de,tr;q=0.7'), 'tr');
  assert.equal(fromAcceptLanguage('tr;q=0, en;q=0.1'), 'en');
});

test('Accept-Language without a supported language gives nothing', () => {
  assert.equal(fromAcceptLanguage(null), null);
  assert.equal(fromAcceptLanguage(''), null);
  assert.equal(fromAcceptLanguage('de,fr;q=0.8,*;q=0.1'), null);
  assert.equal(fromAcceptLanguage('tr;q=abc'), null);
});

test('cookie is parsed among others and validated', () => {
  assert.equal(fromCookie('a=1; lang=tr; b=2'), 'tr');
  assert.equal(fromCookie('lang=xx'), null);
  assert.equal(fromCookie('slang=tr'), null);
  assert.equal(fromCookie(null), null);
});

test('priority: query, then cookie, then browser, then English', () => {
  assert.equal(resolveLocale(url('?lang=en'), 'lang=tr', 'tr'), 'en');
  assert.equal(resolveLocale(url(), 'lang=tr', 'en'), 'tr');
  assert.equal(resolveLocale(url(), null, 'tr-TR'), 'tr');
  assert.equal(resolveLocale(url(), null, null), 'en');
});

test('unsupported values fall through instead of being reflected', () => {
  assert.equal(resolveLocale(url('?lang=<script>'), null, 'tr'), 'tr');
  assert.equal(resolveLocale(url('?lang=de'), 'lang=zz', null), 'en');
});
