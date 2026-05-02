"use client";

import { useEffect, useState, type FormEvent } from "react";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

const STORAGE_KEY = "todo-app:todos";

export default function Page() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTodos(JSON.parse(raw) as Todo[]);
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
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        done: false,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setInput("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-12 sm:py-20">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          ToDo
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {hydrated
            ? remaining > 0
              ? `残り ${remaining} 件のタスク`
              : todos.length === 0
                ? "今日は何をしますか？"
                : "すべて完了しました"
            : " "}
        </p>
      </header>

      <form
        onSubmit={addTodo}
        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="新しいタスクを入力..."
          className="flex-1 bg-transparent px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          aria-label="新しいタスク"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          追加
        </button>
      </form>

      <ul className="mt-6 space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur transition hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => toggleTodo(todo.id)}
              aria-pressed={todo.done}
              aria-label={todo.done ? "未完了に戻す" : "完了にする"}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                todo.done
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white hover:border-slate-500"
              }`}
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
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <span
              className={`flex-1 break-words text-base transition ${
                todo.done
                  ? "text-slate-400 line-through"
                  : "text-slate-800"
              }`}
            >
              {todo.text}
            </span>
            <button
              type="button"
              onClick={() => deleteTodo(todo.id)}
              aria-label="削除"
              className="rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-rose-500 group-hover:opacity-100 focus:opacity-100"
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
        ))}
      </ul>

      {hydrated && todos.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-400">
          まだタスクはありません
        </div>
      )}
    </main>
  );
}
