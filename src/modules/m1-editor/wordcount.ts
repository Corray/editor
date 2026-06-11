/**
 * 字数统计（ADR-017 D5 / TBD-v21-5a）——纯函数，unit 主战场。
 *
 * 计数 = CJK 字符逐字（汉字/假名/谚文，不含 CJK 标点）+ 非 CJK 按字母/数字连续段分词
 * （`_` 视为词内字符；`-` 断词；纯标点不计词）。阅读时长 = cjk/400 + words/200 分钟。
 *
 * perf（实测 2026-06-11，374KB 混排基线）：正则两遍扫描 27.6ms/次（每键阻塞，
 * BHV-008' 家族）→ 单遍 charCode 扫描 4.35ms/次；消费端再经 createDeferred
 * 移出输入路径（EditorArea）。BMP 内 CJK 全覆盖；SMP（Ext-B+ / emoji）不计，
 * 与原正则版语义一致。
 */

const isCJK = (c: number): boolean =>
  (c >= 0x3040 && c <= 0x30ff) || // 日文假名
  (c >= 0x3400 && c <= 0x4dbf) || // CJK Ext-A
  (c >= 0x4e00 && c <= 0x9fff) || // CJK 统一汉字
  (c >= 0xf900 && c <= 0xfaff) || // CJK 兼容
  (c >= 0xac00 && c <= 0xd7af); // 谚文音节

/** 词字符：ASCII 字母/数字/_ + 拉丁扩展 + 0x370–0x1FFF（希腊/西里尔/希伯来/阿拉伯/天城文等）。 */
const isWordChar = (c: number): boolean =>
  (c >= 48 && c <= 57) ||
  (c >= 65 && c <= 90) ||
  (c >= 97 && c <= 122) ||
  c === 95 || // _
  (c >= 0xc0 && c <= 0x24f) ||
  (c >= 0x370 && c <= 0x1fff);

export interface WordCount {
  /** CJK 字符数 */
  cjk: number;
  /** 非 CJK 词数 */
  words: number;
  /** 预估阅读分钟：0 = 空文档；-1 = 不足 1 分钟；其余四舍五入 */
  minutes: number;
}

export function countWords(text: string): WordCount {
  let cjk = 0;
  let words = 0;
  let inWord = false;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (isCJK(c)) {
      cjk += 1;
      inWord = false;
    } else if (isWordChar(c)) {
      if (!inWord) {
        words += 1;
        inWord = true;
      }
    } else if (c < 0xd800 || c > 0xdfff) {
      inWord = false; // 非词字符断词；surrogate（SMP）跳过不断词
    }
  }

  const total = cjk + words;
  const raw = cjk / 400 + words / 200;
  const minutes = total === 0 ? 0 : raw < 1 ? -1 : Math.round(raw);
  return { cjk, words, minutes };
}

/** "N 字 · 约 M 分钟"；空文档 = "0 字"（不显时长）。 */
export function formatWordCount(
  wc: WordCount,
  t: (key: string) => string,
): string {
  const n = wc.cjk + wc.words;
  if (n === 0) return t('wordcount.empty');
  const m = wc.minutes === -1 ? '<1' : String(wc.minutes);
  return t('wordcount.fmt').replace('{n}', String(n)).replace('{m}', m);
}
