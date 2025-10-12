import { create } from "zustand";

type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

export type EditorMeta = {
  dpi: number;
  wmm: number;
  hmm: number;
  bleedMM: number;
  safeMM: number;
};

type EditorStore = {
  meta: EditorMeta;
  setMeta: (p: Partial<EditorMeta>) => void;
  history: HistoryState<string>;
  commit: (json: string) => void;
  undo: () => string | null;
  redo: () => string | null;

  currentTemplateId?: string;
  setTemplateId: (id?: string) => void;

  sampleId?: string;
  setSampleId: (id?: string) => void;
};

const initialJSON = "{}";

export const useEditorStore = create<EditorStore>((set, get) => ({
  meta: { dpi: 300, wmm: 50, hmm: 30, bleedMM: 0, safeMM: 1.5 },
  setMeta: (p) => set((s) => ({ meta: { ...s.meta, ...p } })),
  history: { past: [], present: initialJSON, future: [] },
  commit: (json) =>
    set((s) => ({
      history: { past: [...s.history.past, s.history.present], present: json, future: [] },
    })),
  undo: () => {
    const s = get().history;
    if (!s.past.length) return null;
    const present = s.past[s.past.length - 1];
    const past = s.past.slice(0, -1);
    const future = [s.present, ...s.future];
    set({ history: { past, present, future } });
    return present;
  },
  redo: () => {
    const s = get().history;
    if (!s.future.length) return null;
    const present = s.future[0];
    const past = [...s.past, s.present];
    const future = s.future.slice(1);
    set({ history: { past, present, future } });
    return present;
  },
  currentTemplateId: undefined,
  setTemplateId: (id) => set({ currentTemplateId: id }),
  sampleId: undefined,
  setSampleId: (id) => set({ sampleId: id }),
}));
