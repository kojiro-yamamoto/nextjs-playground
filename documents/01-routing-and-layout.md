# Step 1: ページとレイアウトを作る

> Step 0 で入れた「地図」を、実際のコードで確かめる回。
> テーマは App Router の 2大ファイル、**`page.tsx` と `layout.tsx`**。
> あわせて CSS の当て方、フォント、ページ移動まで。

---

## この Step でやったこと

3つの画面を持つブログの**骨組み**を作った（`/`・`/blog`・`/about`）。
データはまだ持たず、記事 3件は JSX に直書き。

```
src/
├── app/
│   ├── layout.tsx          ← 全ページ共通の外枠
│   ├── globals.css
│   ├── page.tsx            →  /
│   ├── page.module.css
│   ├── about/page.tsx      →  /about
│   └── blog/
│       ├── layout.tsx      ← /blog 配下だけの外枠
│       └── page.tsx        →  /blog
└── components/
    ├── site-header.tsx     ← ヘッダー（ナビ付き）
    └── site-footer.tsx
```

ルーターの設定ファイルは 1行も書いていない。**`page.tsx` を置いた場所が URL になる**だけ。

---

## 1-1. `page.tsx` のルール

```tsx
// src/app/about/page.tsx
import styles from './page.module.css'

export default function AboutPage() {
  return <main className={styles.main}>…</main>
}
```

守るべきことは 2つだけ。

1. **`export default` すること**（Next.js は default export を画面として拾う）
2. **JSX を返すこと**

関数名（`AboutPage`）は Next.js からは見られていない。ただしエラー画面に出るので、
どのページか分かる名前にしておくと助かる。

### 同じフォルダに置いても URL にならないもの

`about/page.module.css` は URL になっていない（`/about/page.module.css` は 404）。
**特別なファイル名（`page` / `layout` / `loading` …）だけが意味を持つ**ので、
それ以外は同じフォルダに安心して置ける。

これが**コロケーション**（そのページでしか使わない CSS や部品をページの隣に置くこと）を
可能にしている。`src/styles/` に CSS を全部集めて、どれがどこで使われているか
分からなくなる事態を避けられる。

---

## 1-2. `layout.tsx`: 共有される外枠

3画面すべてに同じヘッダーとフッターが出ているが、各 `page.tsx` に 3回書いてはいない。

### ルートレイアウト（`src/app/layout.tsx`）

```tsx
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className={notoSansJP.className}>
      <body>
        <SiteHeader />
        {children}      {/* ← ここに page.tsx が入る */}
        <SiteFooter />
      </body>
    </html>
  )
}
```

**ルートレイアウトだけの特別なルール**:

- **必須**。`src/app/layout.tsx` が無いとアプリが動かない
- **`<html>` と `<body>` を自分で書く**。ここにしか書けない
- React（Vite）にあった `index.html` の役割を、このファイルが引き受けている

### 入れ子のレイアウト（`src/app/blog/layout.tsx`）

`/blog` を開くと、ヘッダーの下に「ブログ」という見出しと緑の帯が出る。
これは `blog/layout.tsx` のもので、`/` や `/about` には出ない。

```tsx
export default function BlogLayout({ children }: LayoutProps<'/blog'>) {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.heading}>ブログ</h1>
      {children}
    </div>
  )
}
```

Step 2 で `/blog/[slug]`（記事詳細）を作ると、**そこにも自動的にこの帯が付く**。
「ブログ配下だけに共通のもの」を 1箇所で管理できる、というのが入れ子レイアウトの価値。

そして Step 0 で触れたとおり、**レイアウトは遷移しても作り直されない**。
`/blog → /blog/xxx` の遷移で差し替わるのは `page.tsx` だけで、
2枚の layout はそのまま生き続ける（スクロール位置や開閉状態が保たれる）。
「全部 `page.tsx` に書けばいいのでは？」ではなく、
**共有部分を layout に出すこと自体に機能的な意味がある**。

### `LayoutProps<'/blog'>` とは

`import` していないのに使えている型。Next.js が起動時に
**ルート構造から自動生成するグローバル型**（Step 0 の 0-7 参照）。
動的ルートなら `params` の型まで入る（Step 2 で効いてくる）。

> 型が見つからないと言われたら、一度 `npm run dev` を起動する。
> 型は `.next/types/` へ書き出される仕組みなので、一度も起動していないと存在しない。

---

## 1-3. コンポーネントの置き場所

ヘッダーとフッターは `src/app/` の外（`src/components/`）に置いた。
置き方は 2通りあり、**どちらも正しい**。

| 方式 | 置き場所 | 向いているもの |
|---|---|---|
| **外に出す** | `src/components/` | 複数のページで使い回す部品（今回のヘッダー） |
| **コロケーション** | `src/app/blog/post-card.tsx` | そのルートでしか使わない部品 |

`src/app/` の中に置いても URL にはならないので安全（1-1 参照）。
「絶対に URL にしたくない」と明示したいときは、フォルダ名を `_components` のように
アンダースコアで始めると**ルーティングの対象から完全に除外される**（プライベートフォルダ）。

### `@/` は何なのか

```tsx
import SiteHeader from '@/components/site-header'
```

Next.js の機能ではなく、`tsconfig.json` の `"paths": { "@/*": ["./src/*"] }` で
定義したただのエイリアス。`../../components/...` のような相対パスが不要になり、
ファイルを移動してもパスが壊れない。

---

## 1-4. CSS の当て方

役割で 2つに分けて考える。

### ① `globals.css` — 本当に全体に効かせたいものだけ

入れるのは**リセット・CSS 変数（配色などの共通トークン）・`body` の基本設定**まで。

```css
:root {
  --bg: #fbfbfa;
  --accent: #2f6f4f;
  --content-width: 720px;
}

* { box-sizing: border-box; }
body { background: var(--bg); line-height: 1.8; }
```

`app/` 配下ならどこからでも import できるが、グローバル CSS は
**ページ遷移しても外れない**ので、あちこちで import すると衝突する。
だから import 元は `layout.tsx` 1箇所に留める。

### ② CSS Modules — コンポーネントに閉じ込める

ファイル名を **`*.module.css`** にすると CSS Modules になる。

```css
/* src/components/site-header.module.css */
.header { border-bottom: 1px solid var(--border); }
```

```tsx
import styles from './site-header.module.css'

<header className={styles.header}>…</header>
```

`styles` は **クラス名の対応表が入ったオブジェクト**。
実際にブラウザへ出力された HTML を見るとこうなっている。

```html
<header class="site-header-module__wBaYfG__header">
```

**クラス名が自動でユニークな名前に書き換えられている**。これが CSS Modules の本質。

- **衝突しない**。今回 `page.module.css` を 3箇所に置き、どれにも `.main` があるが混ざらない
- **`.header` のような短い名前を安心して使える**。BEM 的な長い命名規則が不要になる
- **消しやすい**。コンポーネントを削除すれば CSS も一緒に消せる

```tsx
className={styles.titleLink}      // ○ CSS 側は .titleLink
className="titleLink"             // ✗ 変換前の名前なので効かない
```

CSS 側をハイフン区切りにすると `styles['title-link']` と書く必要が出るので、
**クラス名は camelCase にしておく**のが楽。

---

## 1-5. `next/font` でフォントを最適化する

```tsx
import { Noto_Sans_JP } from 'next/font/google'

// ★ モジュールのトップレベルで呼ぶ（コンポーネントの中で呼ぶとエラー）
const notoSansJP = Noto_Sans_JP({ subsets: ['latin'], display: 'swap' })

// className を <html> に付けると、配下すべてに継承される
<html lang="ja" className={notoSansJP.className}>
```

### なぜ `<link>` タグを書かないのか

`<link href="https://fonts.googleapis.com/...">` で読み込む従来の方法には、
**遅い**（Google のサーバーへ別途接続が発生する）・**レイアウトシフト**（フォントが遅れて
届き、切り替わる瞬間に文字幅が変わってガタつく）・**プライバシー**（訪問者の IP が
Google に渡る）という 3つの問題がある。`next/font` はこれを全部解決する。

- **ビルド時にフォントを取得し、自分のサーバーから配信する**（self-hosting）
  → 実行時に外部への通信が発生しない
- **フォントのサイズ情報から代替フォントの表示サイズを自動調整する**
  → 切り替わってもガタつかない（レイアウトシフトがゼロ）

**`next/font` は「便利な import」ではなく、パフォーマンス最適化の機能**。

### `subsets: ['latin']` なのに日本語が出る理由

`Noto Sans JP` が `subsets` で選べるのは `cyrillic` / `latin` / `latin-ext` /
`vietnamese` の 4つだけで、**日本語は含まれていない**。
日本語のグリフは代わりに、**`unicode-range` で細かく分割されたファイル**として配信される。

```bash
$ ls .next/static/media | wc -l
124                      # woff2 が 124 個（@font-face も 124 個）
$ du -sh .next/static/media
5.2M                     # 全部合わせると 5.2MB
```

**5.2MB 全部が送られるわけではない。**
各 `@font-face` に「担当する文字の範囲」（`unicode-range`）が書かれているので、
ブラウザは実際にページに出ている文字に該当するファイルだけを取得する。
だから `subsets` は `latin` を指定しておけばよい。

なお `display: 'swap'` は、読み込みが終わるまで**代替フォントで表示しておく**設定。
付けないと読み込み中に文字が見えない時間が生まれる（FOIT）。

---

## 1-6. `<Link>` でページを移動する

ヘッダーのナビゲーションは `<a>` ではなく `<Link>` を使っている。

```tsx
import Link from 'next/link'

<Link href="/blog">記事一覧</Link>
```

`<a href="/blog">` でも `/blog` へは行けるが、**ブラウザのページ遷移になる**。

| | `<a>` | `<Link>` |
|---|---|---|
| 遷移の中身 | HTML を取り直し、JS を再実行 | 変わる `page.tsx` だけを差し替え |
| レイアウト | **作り直される**（状態が消える） | そのまま（スクロール位置も保たれる） |
| 見た目 | 画面が白く点滅する | 点滅しない |
| 先読み | なし | **プリフェッチ**（画面に入った時点で裏側で取得済み） |

1-2 で見た「レイアウトは遷移しても作り直されない」という性質は、
`<a>` を使った瞬間に丸ごと失われる。

> **原則**: **サイト内の移動は必ず `<Link>`。**
> 外部サイトへのリンクや、意図的にフルリロードさせたいときだけ `<a>`。

`<Link>` は `<a>` タグとして出力されるので、新しいタブで開く・URL をコピーといった
ブラウザの機能はそのまま使える。

---

## 1-7. 動作確認

```bash
npm run dev     # → http://localhost:3000
```

- ヘッダーとフッターが 3画面すべてに出ている（ルートレイアウト）
- 「ブログ」の見出しと帯は `/blog` にだけ出ている（入れ子レイアウト）
- ナビをクリックしても**画面が白く点滅しない**（`<Link>` のクライアントサイド遷移）

`npm run build` すると、**全ページが `○`（Static）**になる。
まだデータもリクエスト固有の情報も使っていないので、Next.js は
「ビルド時に HTML を作り置きできる」と判断した。
この記号が `ƒ`（Dynamic）に変わる瞬間は Step 5 で見る。

---

## つまずきポイント

| 症状 | 原因 |
|---|---|
| ページが 404 になる | フォルダを作っただけで `page.tsx` が無い。または `export default` を忘れている |
| CSS が全く効かない | `*.module.css` なのに `className="header"` と直書きしている。`styles.header` にする |
| `styles.titleLink` が `undefined` | CSS 側のクラス名がハイフン区切りになっている。camelCase に揃える |
| `LayoutProps` が型エラー | 一度も `next dev` / `next build` していない。型は起動時に生成される |
| `next/font` でエラー | コンポーネントの中で呼んでいる。モジュールのトップレベルへ移す |
| 遷移のたびに画面が白く点滅 | `<a>` を使っている。`<Link>` にする |

---

## この Step のまとめ

- **`page.tsx` は `export default` で JSX を返すだけ**。それ以外のファイルは URL にならない
  → 部品や CSS をページの隣に置ける（コロケーション）
- **`layout.tsx` は共有される外枠**。ルートレイアウトは必須で、`<html>` と `<body>` を持つ唯一の場所
- **レイアウトは遷移しても作り直されない**。だから共有部分を layout に出す意味がある
- CSS は **`globals.css`（トークンとリセットだけ）+ CSS Modules（それ以外全部）**
- **`next/font`** はフォントを self-host し、レイアウトシフトを消す最適化機能
- **サイト内の移動は `<Link>`**。`<a>` だとレイアウトごと作り直されてしまう

→ 次は **[Step 2: 記事の一覧と詳細を表示する](./02-server-components-and-dynamic-routes.md)**
