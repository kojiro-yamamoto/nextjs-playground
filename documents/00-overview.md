# Step 0: Next.js の全体像とプロジェクト構成

> このリポジトリの学習の出発点。**Next.js とは何か / なぜ必要か / どう動くのか**という土台を、
> ここで一気に押さえる。以降の Step はすべてこの上に積み上がる。

---

## 0-1. このドキュメントの読み方

Next.js の学習でつまずく最大の原因は、**「React の知識のまま Next.js を書こうとすること」**。

React では「ブラウザの中で JavaScript が画面を描く」のが当たり前だった。
Next.js ではその前提が崩れる。**コードの大半はサーバーで動き、ブラウザには結果だけが届く**。
この前提の切り替えができていないと、`useState` が使えない・`window` が undefined になる、
といった壁に何度もぶつかることになる。

なのでこの Step 0 では順番に、

1. Next.js が**何を解決するために生まれたのか**（React だけだと何が足りないか）
2. その中心にある**レンダリングという考え方**（どこで HTML が作られるのか）
3. それが**ファイルとコードでどう表現されるのか**（App Router / Server Components）
4. **プロジェクトの中身が何をしているのか**（設定ファイルと起動の流れ）

を見ていく。コードを書くのは Step 1 から。ここは「地図」を頭に入れる回。

> **前提**: React の基礎（JSX / コンポーネント / props / state）は既知として進める。
> あやしい場合は [react-playground](https://github.com/kojiro-yamamoto/react-playground/blob/main/documents/00-overview.md) の Step 0 を先に。

---

## 0-2. Next.js とは何か

Next.js は **React を使って Web アプリを作るためのフレームワーク**。Vercel 社製。

React 公式が「新しいアプリを始めるなら」として最初に挙げているのがこの Next.js で、
実務で React を使う場合、素の React ではなくフレームワーク経由になることがほとんど。

### React だけだと何が足りないのか

React は**「UI を作るライブラリ」**であって、それ以上のことは何もしてくれない。
実際にアプリを作ろうとすると、React の守備範囲の外に大量の仕事が残る。

| やりたいこと | React だけの場合 | Next.js の場合 |
|---|---|---|
| URL ごとに画面を切り替える | React Router などを自分で入れて設定 | **フォルダを作れば URL になる** |
| DB から記事を取ってくる | ブラウザから API を叩く（API も別途自作） | **コンポーネントの中で直接 await** |
| 検索エンジンに正しく読ませる | 中身が空の HTML しか返らず不利 | **サーバーで HTML を作って返す** |
| 初回表示を速くする | JS を全部 DL してから描画開始 | **HTML が先に届き、すぐ見える** |
| 画像・フォントの最適化 | 自分で頑張る | **組み込み機能がある** |
| フォーム送信でデータを保存 | API を作り、fetch を書き、状態を管理 | **Server Actions で関数を呼ぶだけ** |

つまり Next.js は、

> **React（UI を作る部分）に、「サーバー」と「ルーティング」を足したもの**

と捉えるとよい。React を置き換えるものではなく、React を**内側に抱えている**。

```
┌─ Next.js ────────────────────────────────┐
│  ルーティング / サーバー / ビルド / 最適化   │
│   ┌─ React ──────────────────────┐       │
│   │  コンポーネント / JSX / state  │       │
│   └──────────────────────────────┘       │
└──────────────────────────────────────────┘
```

Step 1 以降で書くコードも、**中身はほぼ React**。
違うのは「どのファイルに置くか」と「どこで動くか」だけ、と思っておくと気が楽。

---

## 0-3. 一番の肝: レンダリングは「どこで」起きるのか

Next.js を理解する上で最重要の概念がこれ。**HTML は誰が、いつ作るのか**。

### ① CSR（クライアントサイドレンダリング）＝ 素の React / Vite

react-playground で作ったアプリはこれ。

```
ブラウザ ──① リクエスト──▶ サーバー
        ◀─② ほぼ空の HTML ─┘     <div id="root"></div> だけ
        ◀─③ 巨大な JS バンドル ─┘
        ④ JS を実行して、ブラウザが画面を描く  ← ここでやっと見える
        ⑤ さらに API を叩いてデータを取得 → 再描画
```

- 😊 一度読み込めば、以降の画面遷移は爆速
- 😟 **最初の1画面が出るまでが遅い**（JS の DL → 実行 → API 待ち、と直列に待つ）
- 😟 **HTML が空**なので、検索エンジンや SNS のプレビューに中身が伝わりにくい

### ② SSR（サーバーサイドレンダリング）＝ Next.js の基本形

```
ブラウザ ──① リクエスト──▶ サーバー
                          ② サーバーが DB からデータを取り、
                             完成した HTML を組み立てる
        ◀─③ 中身の詰まった HTML ┘  ← この時点でもう読める
        ◀─④ 必要な分だけの JS ──┘
        ⑤ ハイドレーション（HTML にイベントを繋いで操作可能にする）
```

- 😊 **最初から中身のある HTML** が届く → 表示が速く、SEO にも強い
- 😊 DB アクセスやシークレット（API キー）を**サーバー側に隠せる**
- 😟 リクエストのたびにサーバーが働く

### ③ SSG / 静的レンダリング ＝ 事前に作っておく

```
【ビルド時（npm run build）】
  サーバーが全ページの HTML を作って保存しておく

【アクセス時】
  ブラウザ ──▶ 保存済みの HTML をそのまま返すだけ  ← 最速
```

- 😊 **最速・最安**。ただのファイル配信なので落ちにくい
- 😟 内容が固定。更新にはビルドし直しか、再検証（revalidate）の仕組みが必要

### Next.js の答え: 「ページごとに選べる」

昔のフレームワークは「全部 SSR」「全部 SSG」の二択だった。
Next.js は**ルート（ページ）単位で、しかも半自動で**これを切り替える。

| ページ | 向いている方式 | 理由 |
|---|---|---|
| トップページ、記事詳細 | 静的 | 内容が頻繁には変わらない |
| 検索結果、ログイン後のページ | 動的（SSR） | リクエストごとに内容が変わる |
| いいねボタン、フォームの入力中 | クライアント | ブラウザでの操作そのもの |

そして重要なのが、**開発者は「どの方式にするか」を直接指定しない**こと。
「リクエストごとの情報（`searchParams` や cookie）を使ったか？」といったコードの内容から、
Next.js が自動的に判断する。この感覚は Step 5 で実際に確かめる。

> **今の理解目標**: 「React はブラウザで描く」「Next.js はまずサーバーで描く」。
> この一行が入っていれば、次の Server Components の話が通る。

---

## 0-4. App Router: フォルダがそのまま URL になる

Next.js には歴史的に 2つのルーター（Pages Router / App Router）があるが、
**現在の標準は App Router**。このリポジトリでも App Router だけを扱う。
（ネットの古い記事は Pages Router のものが多いので注意。`pages/` ディレクトリが出てきたら古い情報。）

ルールは驚くほど単純。

> **`src/app/` の中のフォルダ構造が、そのまま URL になる。**
> **`page.tsx` を置いたフォルダだけが、公開される URL になる。**

```
src/app/
├── page.tsx                    →  /
├── about/
│   └── page.tsx                →  /about
└── blog/
    ├── page.tsx                →  /blog
    └── [slug]/
        └── page.tsx            →  /blog/hello-nextjs  （[slug] は可変部分）
```

`[slug]` のように角括弧で囲むと**動的ルート**になり、
1つのファイルで「記事の数だけあるページ」を賄える（Step 2 で扱う）。

### 特別なファイル名（ファイル規約）

App Router では、**特定のファイル名に意味が割り当てられている**。
これを覚えることが、App Router を覚えることとほぼ同義。

| ファイル名 | 役割 | 扱う Step |
|---|---|---|
| `page.tsx` | **その URL の画面本体**。これがないと URL として公開されない | 1 |
| `layout.tsx` | 配下のページで**共有される外枠**。ヘッダーやサイドバー | 1 |
| `loading.tsx` | データ取得中に自動で出る**ローディング表示** | 3 |
| `error.tsx` | 例外が起きたときの**エラー画面**（Client Component 必須） | 3 |
| `not-found.tsx` | 404 のときの画面 | 2 |
| `route.ts` | 画面ではなく **API エンドポイント**を作る | 発展 |
| `template.tsx` | layout と似ているが、遷移のたびに作り直される | – |
| `proxy.ts` | リクエストが届く前に差し込む処理（旧 Middleware） | – |

`page.tsx` と `layout.tsx` 以外のファイル（部品用のコンポーネントなど）は
同じフォルダに置いても URL にはならない。**URL になるのは `page.tsx` だけ**。

### layout は入れ子になる

`layout.tsx` は、配下のすべてのページを `children` として包む。
フォルダが入れ子なら、レイアウトも入れ子になる。

```
app/layout.tsx            ← 全ページ共通（<html> と <body> はここにしか書けない）
  └─ app/blog/layout.tsx  ← /blog 配下だけ共通
       └─ app/blog/[slug]/page.tsx
```

実際の描画はこうなる:

```
┌─ app/layout.tsx（サイト全体のヘッダー・フッター）─────┐
│  ┌─ app/blog/layout.tsx（ブログ用のサイドバー）───┐  │
│  │  ┌─ page.tsx（記事本文）─────────────────┐  │  │
│  │  │                                     │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

layout の嬉しい点は、**ページ遷移してもレイアウトは作り直されない**こと。
サイドバーのスクロール位置や開閉状態が、遷移しても保たれる。

---

## 0-5. Server Components と Client Components

Next.js（App Router）で**最も新しく、最も混乱する**概念。ここが Step 3 の中心になるが、
全体像だけは今のうちに入れておく。

### 大原則: 何もしなければ全部サーバーで動く

App Router では、**書いたコンポーネントはデフォルトで Server Component**。
つまり **サーバーで1回だけ実行され、その結果（HTML）だけがブラウザに届く**。
コンポーネントの JavaScript 自体はブラウザに送られない。

```tsx
// src/app/blog/page.tsx — これは Server Component（何も書かなくても）
import { getPosts } from '@/lib/posts'

export default async function BlogPage() {
  const posts = await getPosts()   // ← DB を直接叩いてよい。async/await がそのまま書ける

  return (
    <ul>
      {posts.map((post) => <li key={post.id}>{post.title}</li>)}
    </ul>
  )
}
```

**コンポーネントが `async` になり、中で `await` できる。** これは React 単体ではできなかったこと。
`useEffect` で取ってきて `useState` に入れてローディングを管理して……という定型文が丸ごと消える。

### Client Component: ブラウザでの操作が必要なとき

一方、サーバーで1回実行して終わりでは、**クリックも入力も文字数カウントもできない**。
ブラウザ側で動いてほしいコンポーネントには、ファイルの先頭に `"use client"` と書く。

```tsx
// src/app/ui/like-button.tsx
'use client'

import { useState } from 'react'

export default function LikeButton() {
  const [likes, setLikes] = useState(0)
  return <button onClick={() => setLikes(likes + 1)}>♥ {likes}</button>
}
```

### どちらを使うかの判断表

| 使いたいもの | Server | Client |
|---|:---:|:---:|
| `async` / `await` でのデータ取得 | ✅ | ❌ |
| DB アクセス、API キーなどの秘密情報 | ✅ | ❌（ブラウザに漏れる） |
| `useState` / `useReducer` | ❌ | ✅ |
| `onClick` / `onChange` などのイベント | ❌ | ✅ |
| `useEffect` | ❌ | ✅ |
| `window` / `localStorage` | ❌ | ✅ |
| ブラウザに送る JS の量 | 少ない 😊 | 増える |

判断の指針はシンプル:

> **まず Server Component で書く。**
> **「クリックしたい」「入力したい」「state を持ちたい」となった部分だけを、
> 小さく切り出して Client Component にする。**

### よくある誤解

**❌「`"use client"` を付けたらサーバーでは動かない」**
→ 違う。Client Component も**初回は必ずサーバーで HTML に描かれる**。
   その後ブラウザでハイドレーションされて操作可能になる。
   だから Client Component に `window`(今開いているブラウザ画面（ウィンドウ）をJavaScriptから操作するための入口) を直書きするとエラーになる。
   「クライアント**でも**動く」＝「サーバーとクライアントの**両方**で動く」が正しい理解。

**❌「`"use client"` を書いたファイルだけがクライアント」**
→ 違う。`"use client"` は**境界の宣言**。そこから import された子孫は全部クライアントになる。
   だから `"use client"` はできるだけ**葉（末端）に近い場所**に置く。

```
app/layout.tsx        (Server)
 └ app/blog/page.tsx  (Server) ← ここに "use client" を付けると
    └ PostList        (Server)    ↓ 配下が全部クライアント化してしまう
       └ LikeButton   (Client) ← "use client" はここだけに付けるのが正解
```

**❌「Server Component の中で Client Component は使えない」**
→ 使える。むしろそれが基本形。逆（Client の中で Server を import）はできない。
   ただし Client Component の `children` として Server Component を**渡す**ことはできる。

---

## 0-6. データの流れ: 取得と更新

Next.js のアプリは、この 2方向の流れでできている。Step 2〜5 で実際に手を動かす部分。

### 取得（読み取り）

```
ブラウザ ──アクセス──▶ Server Component が実行される
                        └─ await でデータを取得（定数 / ファイル / DB）
                        └─ HTML を組み立てる
        ◀───────────── 完成した HTML
```

APIを経由しない。**コンポーネントがデータ層を直接呼ぶ**のがポイント。
(これは、Next.jsのServer Componentなら、自分自身がサーバー上で動いているので、わざわざ自分のAPIを経由しなくてもDBなどを直接呼べるという意味)

### 更新（書き込み）＝ Server Actions

React の `<form>` に、**サーバーで動く関数をそのまま渡せる**。
これが Server Actions（Step 4）。

```tsx
// サーバーで動く関数
async function createPost(formData: FormData) {
  'use server'                            // ← この一行が「サーバーで実行せよ」の印
  const title = formData.get('title')
  await savePost({ title })               // DB に保存
  revalidatePath('/blog')                 // 一覧のキャッシュを捨てて作り直させる
  redirect('/blog')
}

// フォームに関数を直接渡す
<form action={createPost}>
  <input name="title" />
  <button type="submit">投稿</button>
</form>
```
(この createPost のような「クライアントから呼び出せる、サーバーで実行される関数」がServer Actionです。
)
注目すべきは、**`fetch` も API エンドポイントも書いていない**こと。
「POST /api/posts を作って、fetch して、レスポンスを見て、画面を更新して……」
という一連の作業が、関数呼び出し1つに畳まれている。

> **注意**: Server Action は実質的に公開エンドポイント。UI 経由でなくても直接叩ける。
> だから認証・認可のチェックは**関数の中で必ず行う**（Step 4 で触れる）。

### 全体像

```
                    ┌──────────────────┐
                    │   サーバー        │
   ①アクセス ─────▶ │  Server Component │──▶ データ取得（DB / ファイル）
                    │        ↓          │
   ②HTML ◀───────── │   HTML を生成     │
                    │                  │
   ③操作・送信 ────▶ │  Server Action    │──▶ データ更新
                    │        ↓          │
   ④更新後のUI ◀──── │  再検証して再描画  │
                    └──────────────────┘
```

---

## 0-7. ファイル構成と、起動の流れ

```
nextjs-playground/
├── documents/          ← 学習ノート（このファイルたち）
├── public/             ← 画像などをそのまま配信するフォルダ（/logo.png で参照）
├── src/
│   └── app/            ← ★ App Router のルート。作業はほぼここ
│       ├── layout.tsx  ← 全ページ共通の外枠（必須。<html> と <body> を持つ）
│       ├── page.tsx    ← "/" の画面
│       └── globals.css ← 全体に効く CSS
├── next.config.ts      ← Next.js の設定
├── tsconfig.json       ← TypeScript の設定（@/* エイリアスもここ）
├── eslint.config.mjs   ← Lint の設定
├── package.json        ← 依存ライブラリとコマンドの定義
├── next-env.d.ts       ← Next.js が自動生成する型定義（触らない）
├── AGENTS.md / CLAUDE.md ← AI コーディング支援向けの指示書（next dev が自動生成）
└── node_modules/       ← DL されたライブラリ本体（Git 管理外）
```

React（Vite）との一番の違いは、**`index.html` が無い**こと。
HTML の器は `layout.tsx` が持っている。

### 画面が表示されるまで

```
① ブラウザが / にアクセス
② Next.js が URL からファイルを探す
     src/app/page.tsx  ← 見つけた
③ 外側の layout.tsx から順に実行する
     app/layout.tsx( app/page.tsx )
④ サーバー上で HTML を組み立てる
⑤ HTML をブラウザへ返す           ← この時点で画面が見える
⑥ 必要な JS を送り、ハイドレーション → 操作可能になる
```

### `layout.tsx` の細かい部分

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Next.js Playground',
  description: 'Next.js を Step ごとに学ぶための学習用リポジトリ',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
```

初見で気になる 3つ。

**`export const metadata`**
`<head>` に入る情報（`<title>` や `<meta name="description">`）を、
HTML タグではなく**オブジェクトとして宣言する**のが Next.js のやり方。Step 2 で詳しく。

**`children`**
配下の `page.tsx` や、さらに内側の `layout.tsx` がここに入る。

**`LayoutProps<'/'>`**
`import` していないのに使えている型。これは Next.js が
`next dev` / `next build` の実行時に**ルート構造から自動生成するグローバル型**。
`PageProps<'/blog/[slug]'>` のように書けば、`params` の中身まで型が付く。
（Step 2 で動的ルートを作るときに効いてくる。）

**`import './globals.css'`**
CSS を JS から import する。Next.js がビルド時に取り出して `<link>` に変換する。
`app/` 配下ならどこからでも import できるが、グローバル CSS は遷移しても外れないので衝突しやすい。
**本当に全体へ効かせたいものだけをここに置き**、個別のスタイルは CSS Modules を使う（Step 1）。

---

## 0-8. Next.js 16 で押さえておくこと

Next.js は変化が速く、**ネット上の記事の多くが古い**。
このリポジトリで使う 16 系で、特に「昔と違う」点を先に挙げておく。
（分からなくても今は問題ない。「記事と違っても慌てない」ための予防接種。）

| 項目 | 昔の書き方 | Next.js 16 |
|---|---|---|
| ルーター | `pages/` ディレクトリ | **`app/` ディレクトリ（App Router）** |
| `params` / `searchParams` | 同期的なオブジェクト | **Promise。`await params` が必要** |
| Middleware | `middleware.ts` | **`proxy.ts`（名前が変わった。機能は同じ）** |
| ページの props 型 | 自分で型を書く | **`PageProps<'/blog/[slug]'>` が自動生成される** |
| ビルドツール | webpack | **Turbopack がデフォルト** |
| キャッシュ | `fetch` が自動でキャッシュ | **明示的なキャッシュへ。`use cache` / `cacheComponents`** |

特に **`params` が Promise になった**のは頻出。以下は Step 2 で必ず書く形。

```tsx
export default async function Page({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params    // ← await を忘れるとエラーになる
  // ...
}
```

> **困ったときの最強の一次情報**: このリポジトリの `node_modules/next/dist/docs/` に、
> **インストールされているバージョンそのものの公式ドキュメント**が入っている。
> ネット検索よりこちらが確実。`01-app/01-getting-started/` から読むとよい。

---

## 0-9. コマンド一覧

```bash
npm install       # 依存ライブラリのインストール（初回とライブラリ追加時のみ）
npm run dev       # 開発サーバー起動 → http://localhost:3000  （Ctrl+C で停止）
npm run build     # 本番用ビルド。各ページが静的か動的かのレポートも出る
npm run start     # ビルド結果を本番同等で起動（build の後にのみ実行できる）
npm run lint      # コードの書き方チェック
```

日常的に使うのはほぼ **`npm run dev`** だけ。起動しっぱなしにしておく。
保存すると **Fast Refresh** で即座に画面へ反映される（React の HMR にあたるもの）。

`npm run build` の出力は Step 5 以降で重要になる。各ルートの横に付く記号を読む:

```
Route (app)
┌ ○ /                    ← ○ = Static  : ビルド時に HTML を作り置き
└ ƒ /blog/[slug]         ← ƒ = Dynamic : リクエストごとにサーバーで生成
```

**自分が書いたコードが、どちらになったのかを確認する**のがこのコマンドの使い方。

---

## 0-10. これから学ぶことの地図

React の中心が「状態」だったのに対し、Next.js の中心は **「どこで実行されるか」**。
すべての機能はこの軸に紐づいている。

```
                  ┌──────────────────────────┐
                  │  どこで実行されるか?       │  ← Next.js の中心
                  └────────────┬─────────────┘
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
  ┌─────▼──────┐      ┌────────▼────────┐      ┌──────▼───────┐
  │  サーバー    │      │  ビルド時        │      │  クライアント  │
  │ Server      │      │  静的レンダリング  │      │ Client       │
  │ Components  │      │  SSG / キャッシュ │      │ Components   │
  │ Server      │      │                 │      │ useState等    │
  │ Actions     │      │                 │      │              │
  └─────────────┘      └─────────────────┘      └──────────────┘
    Step 2,4                Step 5,6                  Step 3,5 
```

| Step | テーマ | 学ぶ中心概念 |
|---|---|---|
| 0 | 全体像とプロジェクト構成 | Next.js の役割、レンダリング方式、App Router |
| 1 | ページとレイアウトを作る | ファイルベースルーティング、`page.tsx` / `layout.tsx`、CSS、`next/font` |
| 2 | 記事の一覧と詳細を表示する | Server Component の `async` データ取得、動的ルート `[slug]`、`params`、`notFound()`、`<Link>`、`generateMetadata` |
| 3 | Client Component を境界として足す | `"use client"`、境界の設計、`loading.tsx` / `error.tsx`、ストリーミング |
| 4 | 記事を投稿する | Server Actions、`<form action>`、`revalidatePath`、JSON ファイルへの永続化 |
| 5 | 検索とレンダリング・キャッシュ | `searchParams`、静的 / 動的レンダリング、再検証、`next build` の読み方 |
| 6 | SQLite に保存してデプロイする | Prisma、スキーマ、マイグレーション、環境変数、デプロイ |

### この先の発展トピック（本編では扱わない）

一通り終えたあと、必要になったタイミングで公式ドキュメントを引けばよいもの。

| トピック | 何をするもの |
|---|---|
| Route Handlers（`route.ts`） | 画面ではなく API エンドポイントを作る。外部から JSON を返したいとき |
| Proxy（`proxy.ts`） | リクエスト到達前の差し込み処理。認証ガードや A/B テスト |
| 認証・認可 | ログイン状態の管理。Server Action / Server Component 側でのチェック |
| 並列ルート / インターセプトルート | モーダルを URL で表現するなどの高度なルーティング |
| Cache Components（`use cache`） | キャッシュを細かく制御する新しい仕組み |

---

## 0-11. 用語集

| 用語 | 意味 |
|---|---|
| **App Router** | `app/` フォルダの構造で URL を決める、現行の Next.js のルーティング方式 |
| **Pages Router** | `pages/` を使う旧方式。古い記事はこちらが多い。このリポジトリでは扱わない |
| **ルート / セグメント** | URL の一区切り。`/blog/hello` なら `blog` と `hello` がセグメント |
| **動的ルート** | `[slug]` のような可変部分を持つルート。1ファイルで多数のページを賄う |
| **ファイル規約** | `page.tsx` `layout.tsx` など、名前自体に意味があるファイルの決まり |
| **Server Component** | サーバーで実行され、結果の HTML だけが送られるコンポーネント。**デフォルト** |
| **Client Component** | `"use client"` を付け、ブラウザでも動くコンポーネント。state やイベントが使える |
| **`"use client"`** | サーバー / クライアントの**境界**の宣言。配下はすべてクライアントになる |
| **`"use server"`** | その関数をサーバーで実行させる印。Server Actions を作る |
| **Server Actions** | フォーム送信などから直接呼べる、サーバー側の関数。API を書かずに更新できる |
| **ハイドレーション** | 送られてきた HTML に JS を繋ぎ、操作可能な状態にすること |
| **SSR** | Server Side Rendering。リクエストのたびにサーバーで HTML を作る |
| **SSG / 静的レンダリング** | ビルド時に HTML を作り置きしておく。最速 |
| **CSR** | Client Side Rendering。ブラウザが JS で画面を描く。素の React のやり方 |
| **ストリーミング** | 完成した部分から順に HTML を送る仕組み。`loading.tsx` や `<Suspense>` が使う |
| **再検証 / revalidate** | キャッシュした内容を捨てて作り直させること |
| **Route Handler** | `route.ts` で作る API エンドポイント |
| **Proxy** | リクエスト到達前に差し込む処理。Next.js 15 以前の Middleware |
| **Turbopack** | Next.js 16 標準のビルドツール。webpack の後継 |
| **Fast Refresh** | 保存した瞬間、状態を保ったまま画面へ反映される仕組み |

---

## 0-12. 参考リンク

- [Next.js 公式ドキュメント](https://nextjs.org/docs) — **一次情報**。App Router の "Getting Started" から
- [`node_modules/next/dist/docs/`](../node_modules/next/dist/docs/) — **インストール済みバージョンそのものの公式ドキュメント**。最も確実
- [Learn Next.js（公式チュートリアル）](https://nextjs.org/learn) — ダッシュボードアプリを作る公式コース
- [React 公式: Server Components](https://ja.react.dev/reference/rsc/server-components)
- [react-playground の Step 0](https://github.com/kojiro-yamamoto/react-playground/blob/main/documents/00-overview.md) — React 側の土台

---

## この Step のまとめ

- Next.js は **React に「サーバー」と「ルーティング」を足したフレームワーク**。React を置き換えるものではない
- 最重要の視点は **「そのコードはどこで実行されるのか」**（サーバー / ビルド時 / ブラウザ）
- **App Router では、フォルダが URL になり、`page.tsx` を置いた場所だけが公開される**
- コンポーネントは**デフォルトで Server Component**。`async`/`await` でデータを直接取れる
- **`"use client"` は境界の宣言**。操作が必要な末端だけに、小さく付ける
- データ更新は **Server Actions**。API を書かずにフォームからサーバー関数を呼べる
- Next.js は変化が速い。**迷ったら `node_modules/next/dist/docs/` の公式ドキュメント**

→ 次は **[Step 1: ページとレイアウトを作る](./01-routing-and-layout.md)**
