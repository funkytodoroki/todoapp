# ToDo

シンプルでおしゃれなToDo管理アプリ。Next.js (App Router) + TypeScript + Tailwind CSS 製。タスクはブラウザの localStorage に保存されます。

## 機能

- タスクの追加
- 完了チェック
- 削除

## ローカル起動

```bash
npm install
npm run dev
```

http://localhost:3000 を開いてください。

## Vercelへのデプロイ

1. このリポジトリを GitHub などに push
2. [vercel.com](https://vercel.com) で「Add New… → Project」からインポート
3. フレームワークは自動で **Next.js** が検出されます。設定変更は不要
4. **Deploy** を押すだけで完了

CLI からデプロイする場合:

```bash
npm i -g vercel
vercel
```
