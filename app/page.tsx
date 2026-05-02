"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type Priority = "high" | "medium" | "low";
type Category = "work" | "private" | "other";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  priority: Priority;
  category: Category;
  dueDate?: string;
};

const STORAGE_KEY = "todo-app:todos:v2";
const LEGACY_KEY = "todo-app:todos";

const PRIORITY_LABEL: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const PRIORITY_DOT: Record<Priority, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const CATEGORY_LABEL: Record<Category, string> = {
  work: "仕事",
  private: "プライベート",
  other: "その他",
};

const CATEGORY_BADGE: Record<Category, string> = {
  work: "bg-emerald-100 text-emerald-800 border-emerald-200",
  private: "bg-teal-100 text-teal-800 border-teal-200",
  other: "bg-lime-100 text-lime-800 border-lime-200",
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDue(due: string): { label: string; tone: "ok" | "soon" | "over" } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${due}T00:00:00`);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: `${-diff}日経過`, tone: "over" };
  if (diff === 0) return { label: "今日まで", tone: "soon" };
  if (diff === 1) return { label: "明日まで", tone: "soon" };
  if (diff <= 3) return { label: `${diff}日後`, tone: "soon" };
  return { label: `${diff}日後`, tone: "ok" };
}

export default function Page() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<Category>("work");
  const [dueDate, setDueDate] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [justToggled, setJustToggled] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setTodos(JSON.parse(raw) as Todo[]);
      } else {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const old = JSON.parse(legacy) as Array<{
            id: string;
            text: string;
            done: boolean;
            createdAt: number;
          }>;
          setTodos(
            old.map((t) => ({
              ...t,
              priority: "medium",
              category: "other",
            })),
          );
        }
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos, hydrated]);

  const addTodo = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [
      {
        id: makeId(),
        text: t,
        done: false,
        createdAt: Date.now(),
        priority,
        category,
        dueDate: dueDate || undefined,
      },
      ...prev,
    ]);
    setText("");
    setDueDate("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
    setJustToggled(id);
    window.setTimeout(() => setJustToggled(null), 360);
  };

  const deleteTodo = (id: string) => {
    setRemoving((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    window.setTimeout(() => {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  };

  const visible = useMemo(() => {
    return todos
      .filter((t) => filterCategory === "all" || t.category === filterCategory)
      .filter((t) => filterPriority === "all" || t.priority === filterPriority)
      .slice()
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (p !== 0) return p;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [todos, filterCategory, filterPriority]);

  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const rate = total > 0 ? doneCount / total : 0;

  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - rate);

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-br from-emerald-700 to-teal-600 bg-clip-text text-3xl font-semibold tracking-tight text-transparent">
            ToDo
          </h1>
          <p className="mt-1 text-sm text-emerald-800/60">
            {hydrated
              ? total === 0
                ? "今日は何をしますか？"
                : `${doneCount} / ${total} 完了`
              : " "}
          </p>
        </div>
        <div
          className="relative"
          aria-label={`完了率 ${Math.round(rate * 100)}%`}
        >
          <svg width="80" height="80" viewBox="0 0 80 80">
            <defs>
              <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="#d1fae5"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="url(#ring)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dashoffset 600ms ease" }}
            />
          </svg>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-emerald-700">
            {Math.round(rate * 100)}%
          </span>
        </div>
      </header>

      <form
        onSubmit={addTodo}
        className="rounded-2xl border border-emerald-100 bg-white/70 p-3 shadow-sm backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="新しいタスクを入力..."
            className="flex-1 bg-transparent px-3 py-2 text-base text-emerald-950 placeholder:text-emerald-700/40 focus:outline-none"
            aria-label="新しいタスク"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition active:scale-95 hover:from-emerald-600 hover:to-teal-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            追加
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-emerald-50 pt-3 text-sm">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="rounded-lg border border-emerald-100 bg-white px-2 py-1 text-emerald-800 focus:border-emerald-400 focus:outline-none"
            aria-label="優先度"
          >
            <option value="high">優先度: 高</option>
            <option value="medium">優先度: 中</option>
            <option value="low">優先度: 低</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="rounded-lg border border-emerald-100 bg-white px-2 py-1 text-emerald-800 focus:border-emerald-400 focus:outline-none"
            aria-label="カテゴリ"
          >
            <option value="work">仕事</option>
            <option value="private">プライベート</option>
            <option value="other">その他</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-emerald-100 bg-white px-2 py-1 text-emerald-800 focus:border-emerald-400 focus:outline-none"
            aria-label="締め切り日"
          />
        </div>
      </form>

      <div className="mt-5 space-y-2">
        <FilterRow
          label="カテゴリ"
          value={filterCategory}
          onChange={setFilterCategory}
          options={[
            { value: "all", label: "すべて" },
            { value: "work", label: "仕事" },
            { value: "private", label: "プライベート" },
            { value: "other", label: "その他" },
          ]}
        />
        <FilterRow
          label="優先度"
          value={filterPriority}
          onChange={setFilterPriority}
          options={[
            { value: "all", label: "すべて" },
            { value: "high", label: "高" },
            { value: "medium", label: "中" },
            { value: "low", label: "低" },
          ]}
        />
      </div>

      <ul className="mt-5 space-y-2">
        {visible.map((todo) => {
          const due = todo.dueDate ? formatDue(todo.dueDate) : null;
          const isRemoving = removing.has(todo.id);
          return (
            <li
              key={todo.id}
              className={`group flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur transition hover:shadow-md ${
                isRemoving ? "animate-fade-out" : "animate-slide-in"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleTodo(todo.id)}
                aria-pressed={todo.done}
                aria-label={todo.done ? "未完了に戻す" : "完了にする"}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  todo.done
                    ? "border-emerald-600 bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                    : "border-emerald-300 bg-white hover:border-emerald-500"
                } ${justToggled === todo.id ? "animate-pop" : ""}`}
              >
                {todo.done && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M5 10.5l3 3 7-7"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div
                  className={`break-words text-base transition ${
                    todo.done
                      ? "text-emerald-700/40 line-through"
                      : "text-slate-800"
                  }`}
                >
                  {todo.text}
                </div>
                <div
                  className={`mt-1.5 flex flex-wrap items-center gap-1.5 text-xs ${
                    todo.done ? "opacity-60" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[todo.priority]}`}
                    />
                    <span className="text-slate-600">
                      {PRIORITY_LABEL[todo.priority]}
                    </span>
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 ${CATEGORY_BADGE[todo.category]}`}
                  >
                    {CATEGORY_LABEL[todo.category]}
                  </span>
                  {due && (
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 ${
                        todo.done
                          ? "bg-slate-100 text-slate-400"
                          : due.tone === "over"
                            ? "bg-rose-100 text-rose-700"
                            : due.tone === "soon"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {due.label}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                aria-label="削除"
                className="rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 focus:opacity-100"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>

      {hydrated && total === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-emerald-200 px-6 py-10 text-center text-sm text-emerald-700/60">
          まだタスクはありません
        </div>
      )}
      {hydrated && total > 0 && visible.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-emerald-200 px-6 py-10 text-center text-sm text-emerald-700/60">
          条件に一致するタスクはありません
        </div>
      )}
    </main>
  );
}

function FilterRow<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs font-medium text-emerald-800/70">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              value === opt.value
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm"
                : "bg-white/70 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
