import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSuggestion } from './costStructure.ts';

test('model yanıtındaki JSON ayrıştırılır ve %100e normalize edilir', () => {
  const text = 'Özet:\n```json\n{"sektor":"Plastik","malzeme":{"min":45,"max":55,"ort":50},"iscilik":{"min":10,"max":15,"ort":12},"enerji":{"min":5,"max":8,"ort":6},"bakim":{"min":2,"max":4,"ort":3},"genel":{"min":15,"max":20,"ort":18},"kar":{"min":5,"max":10,"ort":7},"aciklama":"x"}\n```';
  const s = parseSuggestion(text);
  assert.equal(s.malzeme.ort, Math.round(50 / 96 * 1000) / 10);
  const sum = ['malzeme', 'iscilik', 'enerji', 'bakim', 'genel', 'kar'].reduce((a, k) => a + (s as any)[k].ort, 0);
  assert.ok(Math.abs(sum - 100) < 0.5);
});

test('mantıksız oranlar reddedilir', () => {
  assert.throws(() => parseSuggestion('{"malzeme":{"ort":150}}'));
});
