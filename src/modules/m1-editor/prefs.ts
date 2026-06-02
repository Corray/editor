import { createSignal, createEffect, type Accessor } from 'solid-js';

/**
 * Editor display preferences — F1.2 行号 / F1.3 字号（PRD §F1）。
 *
 * 仅供 chrome（AppShell header 控件 + EditorArea）消费，不导出给 M2/M3/M4
 * 业务模块（api-spec §3.1「内部状态，不导出」的语义边界 = 不进跨模块契约，
 * chrome 装配线可用）。范式照搬 M6 theme：signal + createEffect 镜像 + 持久化。
 */
export interface EditorPrefsAPI {
  /** 当前字号（px），恒为 {@link FONT_SIZE_PRESETS} 之一。 */
  readonly fontSize: Accessor<number>;
  /** 行号 gutter 是否显示（F1.2，默认开）。 */
  readonly showLineNumbers: Accessor<boolean>;
  /** 增大字号——向上跨一档，封顶不动。 */
  increaseFontSize(): void;
  /** 减小字号——向下跨一档，触底不动。 */
  decreaseFontSize(): void;
  /** 切换行号显示。 */
  toggleLineNumbers(): void;
}

/** 字号档位（px）——极简三档；中档 15 = 旧 .editor-area 的 0.9375rem。 */
export const FONT_SIZE_PRESETS = [13, 15, 17] as const;
const DEFAULT_FONT_SIZE = 15;

const STORAGE_KEY = 'editor.prefs.v1';

interface StoredPrefs {
  fontSize: number;
  showLineNumbers: boolean;
}

/**
 * 从 localStorage 读取，带 anti-poisoning 校验：
 *   - fontSize 必须落在预设档位内，否则回默认
 *   - showLineNumbers 必须是 boolean，否则回默认开
 *   - JSON 损坏 / localStorage 不可用 → 全量回默认
 */
function readInitial(): StoredPrefs {
  const fallback: StoredPrefs = {
    fontSize: DEFAULT_FONT_SIZE,
    showLineNumbers: true,
  };

  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return fallback;
  }
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    const presets = FONT_SIZE_PRESETS as readonly number[];
    return {
      fontSize:
        typeof parsed.fontSize === 'number' && presets.includes(parsed.fontSize)
          ? parsed.fontSize
          : DEFAULT_FONT_SIZE,
      showLineNumbers:
        typeof parsed.showLineNumbers === 'boolean'
          ? parsed.showLineNumbers
          : true,
    };
  } catch {
    return fallback;
  }
}

/**
 * 构建 EditorPrefsAPI。必须在 Solid reactive root 内调用（含 createEffect）。
 *
 * 副作用：
 *   - fontSize 镜像到 documentElement 的 `--editor-font-size` CSS 变量
 *     （驱动 .editor-area + .editor-gutter 同步字号/行高）
 *   - 每次变更把 { fontSize, showLineNumbers } 序列化写回 localStorage
 */
export function createEditorPrefs(): EditorPrefsAPI {
  const initial = readInitial();
  const [fontSize, setFontSize] = createSignal<number>(initial.fontSize);
  const [showLineNumbers, setShowLineNumbers] = createSignal<boolean>(
    initial.showLineNumbers,
  );

  createEffect(() => {
    const fs = fontSize();
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(
        '--editor-font-size',
        `${fs}px`,
      );
    }
  });

  createEffect(() => {
    const snapshot: StoredPrefs = {
      fontSize: fontSize(),
      showLineNumbers: showLineNumbers(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // quota / privacy mode — best-effort，不阻塞 UI。
    }
  });

  const stepFontSize = (dir: 1 | -1) => {
    const presets = FONT_SIZE_PRESETS as readonly number[];
    const cur = presets.indexOf(fontSize());
    const safe = cur === -1 ? presets.indexOf(DEFAULT_FONT_SIZE) : cur;
    const target = presets[safe + dir];
    if (target !== undefined) setFontSize(target);
  };

  return {
    fontSize,
    showLineNumbers,
    increaseFontSize: () => stepFontSize(1),
    decreaseFontSize: () => stepFontSize(-1),
    toggleLineNumbers: () => setShowLineNumbers((v) => !v),
  };
}
