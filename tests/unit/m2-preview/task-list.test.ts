import { describe, it, expect } from 'vitest';
import { render, toggleTaskAtLine } from '@/modules/m2-preview/pipeline';

// 测试计划 v3.1 §家族 渲染族 + 翻转族 + XSS 族（AC-v31-1~6）
describe('M2 task list render — CT-TL (AC-v31-1/5/6)', () => {
  it('CT-TL-1: `- [ ]` → 未勾 checkbox（带 class + data-source-line）', () => {
    const html = render('- [ ] todo');
    expect(html).toContain('class="task-checkbox"');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('data-source-line="0"');
    expect(html).not.toContain('checked');
  });

  it('CT-TL-2: `- [x]` / `- [X]` → 勾选 checkbox', () => {
    expect(render('- [x] done')).toContain('checked');
    expect(render('- [X] done')).toContain('checked');
  });

  it('CT-TL-3: 普通列表项 `- item` 不渲 checkbox', () => {
    expect(render('- item')).not.toContain('task-checkbox');
  });

  it('CT-TL-4: 行内 `[ ]`（非列表行首）不误渲', () => {
    expect(render('text [ ] inline')).not.toContain('task-checkbox');
  });

  it('CT-TL-5: 多任务各带正确行号', () => {
    const html = render('- [ ] a\n- [x] b');
    expect(html).toContain('data-source-line="0"');
    expect(html).toContain('data-source-line="1"');
  });

  it('CT-TL-6: XSS — 任务项恶意内容经 sanitize 剥离（AC-v31-5 unit 层）', () => {
    const html = render('- [ ] <script>alert(1)</script><img src=x onerror=alert(1)>');
    expect(html).toContain('task-checkbox'); // checkbox 仍渲染
    expect(html).not.toContain('<script>');
    expect(html).not.toMatch(/<img[^>]+onerror/);
  });
});

describe('M2 toggleTaskAtLine — CT-TT (AC-v31-2/3)', () => {
  it('CT-TT-1: [ ] → [x]', () => {
    expect(toggleTaskAtLine('- [ ] todo', 0)).toBe('- [x] todo');
  });
  it('CT-TT-2: [x] → [ ]（含大写 X）', () => {
    expect(toggleTaskAtLine('- [x] done', 0)).toBe('- [ ] done');
    expect(toggleTaskAtLine('- [X] done', 0)).toBe('- [ ] done');
  });
  it('CT-TT-3: 多行指定行精确翻转（不串）', () => {
    const src = '- [ ] a\n- [ ] b\n- [ ] c';
    expect(toggleTaskAtLine(src, 1)).toBe('- [ ] a\n- [x] b\n- [ ] c');
  });
  it('CT-TT-4: 缩进任务项', () => {
    expect(toggleTaskAtLine('  - [ ] nested', 0)).toBe('  - [x] nested');
  });
  it('CT-TT-5: 非任务行 / 越界 → 原样返回', () => {
    expect(toggleTaskAtLine('plain', 0)).toBe('plain');
    expect(toggleTaskAtLine('- item', 0)).toBe('- item');
    expect(toggleTaskAtLine('- [ ] a', 5)).toBe('- [ ] a');
    expect(toggleTaskAtLine('- [ ] a', -1)).toBe('- [ ] a');
  });
  it('CT-TT-6: * / + 列表标记也支持', () => {
    expect(toggleTaskAtLine('* [ ] a', 0)).toBe('* [x] a');
    expect(toggleTaskAtLine('+ [ ] a', 0)).toBe('+ [x] a');
  });
});
