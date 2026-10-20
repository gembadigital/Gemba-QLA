import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourcesOf } from './costStructure.ts';

test('web arama sonuçlarından kaynaklar tekilleştirilerek çıkarılır, hata bloğu atlanır', () => {
  const content: any[] = [
    { type: 'server_tool_use', id: 's1', name: 'web_search', input: {} },
    { type: 'web_search_tool_result', tool_use_id: 's1', content: [
      { type: 'web_search_result', url: 'https://a.org/x', title: 'A' },
      { type: 'web_search_result', url: 'https://a.org/x', title: 'A tekrar' },
      { type: 'web_search_result', url: 'https://b.org/y', title: '' },
    ] },
    { type: 'web_search_tool_result', tool_use_id: 's2', content: { type: 'web_search_tool_result_error', error_code: 'max_uses_exceeded' } },
    { type: 'text', text: '```json {} ```' },
  ];
  assert.deepEqual(sourcesOf(content), [
    { title: 'A', url: 'https://a.org/x' },
    { title: 'https://b.org/y', url: 'https://b.org/y' },
  ]);
});
