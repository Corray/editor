/**
 * 字数统计（ADR-017 D5 / TBD-v21-5a）——纯函数，unit 主战场。
 *
 * 计数 = CJK 字符逐字（汉字/假名/谚文，不含 CJK 标点）+ 非 CJK 按空白分词
 * （仅含字母/数字的 token 计词，纯标点不计）。
 * 阅读时长 = cjk/400 + words/200 分钟。
 */

/** 汉字（含扩展A/兼容）+ 日文假名 + 谚文音节；不含 CJK 标点（　-〿）。 */
const CJK_RE = /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/g;
const HAS_ALNUM_RE = /[\p{L}\p{N}]/u;

export interface WordCount {
  /** CJK 字符数 */
  cjk: number;
  /** 非 CJK 词数 */
  words: number;
  /** 预估阅读分钟：0 = 空文档；-1 = 不足 1 分钟；其余四舍五入 */
  minutes: number;
}

export function countWords(text: string): WordCount {
  const cjk = text.match(CJK_RE)?.length ?? 0;
  const words = text
    .replace(CJK_RE, ' ')
    .split(/\s+/)
    .filter((tok) => HAS_ALNUM_RE.test(tok)).length;

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
