# nextjs-playground

Next.js の学習用リポジトリ。**ブログアプリ**を少しずつ作りながら Next.js（App Router）の基礎を学びます。

学習ノートは [`documents/`](./documents) に Step ごとの Markdown として残しています。
**`documents/00-overview.md` から順に読めば、Next.js の全体像を追える**構成です。

> React そのものの基礎（JSX / コンポーネント / state）は
> [react-playground](https://github.com/kojiro-yamamoto/react-playground) で扱っています。こちらはその続きとして、
> **「React だけでは足りない部分を Next.js がどう埋めるか」**に焦点を当てます。

## 技術構成

- Next.js 16（App Router / Turbopack）
- React 19 + TypeScript
- スタイルは素の CSS（Tailwind は使いません。Next.js の学習に集中するため）
- データは Step が進むにつれて **定数 → JSON ファイル → SQLite** と育てていきます

## 起動方法

```bash
npm install   # 初回のみ
npm run dev   # 開発サーバー起動 → http://localhost:3000
```

## 学習ロードマップ

| # | ステップ | 学ぶこと | ノート | 状態 |
|---|---------|---------|--------|------|
| 0 | 全体像とプロジェクト構成 | Next.js が解決する問題、レンダリング方式、App Router、Server Components | [00-overview.md](./documents/00-overview.md) | ✅ |
| 1 | ページとレイアウトを作る | ファイルベースルーティング、`page.tsx` / `layout.tsx`、CSS Modules、`next/font`、`<Link>` | [01-routing-and-layout.md](./documents/01-routing-and-layout.md) | ✅ |
| 2 | 記事の一覧と詳細を表示する | Server Component の `async` データ取得、動的ルート `[slug]`、`params`、`notFound()`、`generateMetadata`、`generateStaticParams` | [02-server-components-and-dynamic-routes.md](./documents/02-server-components-and-dynamic-routes.md) | ✅ |
| 3 | Client Component を境界として足す | `"use client"`、サーバー / クライアント境界の設計、`loading.tsx` / `error.tsx`、`<Suspense>` とストリーミング | [03-client-components.md](./documents/03-client-components.md) | ✅ |
| 4 | 記事を投稿する | Server Actions、`<form action>`、`useActionState`、`revalidatePath`、JSON ファイルへの永続化 | [04-server-actions.md](./documents/04-server-actions.md) | ✅ |
| 5 | 検索とレンダリング・キャッシュ | `searchParams`、URL を状態として使う、静的 / 動的レンダリング、再検証、`next build` の読み方 | – | ⬜ |
| 6 | SQLite に保存してデプロイする | Prisma、スキーマ設計、マイグレーション、環境変数、デプロイ | – | ⬜ |

各 Step の完了時点は `step0`〜`step6` ブランチとしてリモートに残してあります。
その Step の画面を動かしたいときは、ブランチを切り替えて `npm run dev` すれば見られます。

```bash
git switch step2   # Step 2 完了時点の状態
npm run dev
```

`main` は常に最新（Step4 まで完了した状態）です。

### この先の発展トピック（本編では扱わない）

Route Handlers（`route.ts`）、Proxy（`proxy.ts`）、認証・認可、並列 / インターセプトルート、
Cache Components（`use cache`）。一通り終えたあと、必要になったタイミングで公式ドキュメントを引きます。

## 進め方

各 Step では、

1. 実装を行う
2. その Step で学んだ内容を `documents/NN-*.md` に書き残す

という流れで進めます。
