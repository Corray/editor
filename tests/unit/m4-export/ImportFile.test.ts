import { describe, it, expect } from 'vitest';
import { looksBinary } from '@/modules/m4-export/ImportFile';

describe('M4 looksBinary — 二进制检测（F-V12-2）', () => {
  it('纯文本（含中文/emoji/markdown）不误判', () => {
    expect(looksBinary('# 标题\n\n正文 plain text 😀\n\n- a\n- b')).toBe(false);
    expect(looksBinary('')).toBe(false);
    expect(looksBinary('   \n\t  ')).toBe(false);
  });

  it('含 NUL → 判二进制', () => {
    expect(looksBinary('abc' + String.fromCharCode(0) + 'def')).toBe(true);
  });

  it('大量 U+FFFD 替换字符（无效 UTF-8 解码产物）→ 判二进制', () => {
    const fffd = String.fromCharCode(0xfffd);
    const binaryish = fffd.repeat(50) + 'a'.repeat(50); // 50% 替换字符
    expect(looksBinary(binaryish)).toBe(true);
  });

  it('偶发替换字符（<10%）不误判', () => {
    const fffd = String.fromCharCode(0xfffd);
    const mostlyText = 'normal markdown text here '.repeat(20) + fffd;
    expect(looksBinary(mostlyText)).toBe(false);
  });
});
