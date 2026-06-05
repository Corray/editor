/**
 * 应用层 ID 前缀集中常量（arch-constraints §6）。
 * 顶级对象 document → `D_<uuid>`（省父级段）。
 */
export const EntityIdPrefixes = {
  DOC: 'D_',
} as const;

/** 生成文档 ID：`D_<uuid>`。crypto.randomUUID（HTTPS/现代浏览器 + Node 18+）。 */
export function newDocId(): string {
  return EntityIdPrefixes.DOC + crypto.randomUUID();
}
