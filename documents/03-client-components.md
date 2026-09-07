# Step 3: Client Component を境界として足す

> Step 2 まではすべてサーバーで完結していた。ここで初めて**ブラウザ側**を足す。
> テーマは `"use client"`・**境界の設計**・`loading.tsx` / `error.tsx`・**ストリーミング**。
> Step 0 で「最も混乱する概念」と書いた部分を、実物で潰す回。

---

## この Step でやったこと

```
src/
├── lib/posts.ts                       ← 学習用の遅延を追加 + getRelatedPosts
├── components/
│   ├── site-header.tsx                ← Server のまま
│   └── nav-links.tsx                  ← ★ "use client"（現在地をハイライト）
└── app/blog/
    ├── loading.tsx                    ← ★ 読み込み中の表示
    ├── error.tsx                      ← ★ 例外時の表示（Client 必須）
    └── [slug]/
        ├── page.tsx                   ← <Suspense> を追加
        ├── share-button.tsx           ← ★ "use client"（リンクをコピー）
        └── related-posts.tsx          ← 遅い Server Component
```

### 先に: 学習用の遅延を入れた

定数配列は一瞬で返ってしまい、ローディングもストリーミングも観察できない。
そこで `lib/posts.ts` に DB アクセス相当の待ち時間を入れた。

```ts
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getPosts()        { await sleep(400);  /* ... */ }
export async function getPost(slug)     { await sleep(400);  /* ... */ }
export async function getRelatedPosts() { await sleep(1500); /* ... */ }  // 重い処理の例
```

Step 6 で本物の SQLite に差し替えるときに削除する。

---

## 3-1. `"use client"` が必要になる場面

今回 2つ作った。どちらも**「サーバーでは原理的に無理なこと」**をしている。

### ① フックを使う — 現在地のハイライト

ヘッダーのナビで、開いているページを太字にした。
「いま開いている URL」を知るには `usePathname` フックが必要。

```tsx
// src/components/nav-links.tsx
'use client'

import { usePathname } from 'next/navigation'

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav>
      {links.map((link) => {
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            className={isActive ? styles.active : styles.link}
            aria-current={isActive ? 'page' : undefined}
            href={link.href}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

**フックは Server Component では一切使えない。**
`useState` はもちろん、`usePathname` や `useSearchParams` のような
Next.js 製のフックも同じ。`use` で始まる関数を書いたら `"use client"` が要る。

### ② ブラウザの API を使う — リンクのコピー

```tsx
// src/app/blog/[slug]/share-button.tsx
'use client'

import { useState } from 'react'

export default function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button type="button" onClick={handleClick} disabled={copied}>
      {copied ? '✓ コピーしました' : 'リンクをコピー'}
    </button>
  )
}
```

`navigator` も `window` もサーバーには存在しない。
そして `onClick` のようなイベントハンドラも、サーバーには渡せない
（HTML には「関数」を埋め込めない）。

---

## 3-2. 境界は葉に近い場所へ

ここが Step 3 の本題。**`"use client"` をどこに書くか**で設計が決まる。

ヘッダーは「サイト名 + ナビ」だが、`"use client"` を付けたのは
**ナビだけ**で、`site-header.tsx` には付けていない。

```tsx
// src/components/site-header.tsx — "use client" が無い = Server Component のまま
import NavLinks from './nav-links'

export default function SiteHeader() {
  return (
    <header>
      <p><Link href="/">Next.js Playground</Link></p>
      <NavLinks />        {/* ← ここだけ Client */}
    </header>
  )
}
```

### なぜ分けるのか

`"use client"` は**そのファイルだけの宣言ではなく、境界の宣言**。
そこから import されたものは、子孫まで全部クライアント側になる。

```
[やってしまいがちな形]              [今回やった形]
app/layout.tsx      (Server)        app/layout.tsx      (Server)
 └ SiteHeader       (Client) ←付ける └ SiteHeader       (Server)
    └ NavLinks      (Client)            └ NavLinks      (Client) ←付ける
    └ 将来足す部品   (Client)            └ 将来足す部品   (Server)
       ↑ 巻き込まれる                       ↑ サーバーのまま
```

左の形にすると、ヘッダーに何を足してもクライアント側になる。
`await` でデータを取ることもできなくなり、ブラウザに送る JS も増えていく。

> **原則**: **まず全部 Server Component で書く。**
> 「フックを使いたい」「イベントを繋ぎたい」「ブラウザ API を触りたい」となった箇所だけを、
> **できるだけ小さく切り出して** `"use client"` を付ける。

### Server → Client に props を渡すのは OK

記事詳細ページ（Server Component）の中に `<ShareButton />` を置いている。
**Server Component の中に Client Component を置くのが基本形**。逆はできない。

| | できるか |
|---|---|
| Server の中に Client を置く | ✅ 基本形 |
| Server から Client へ props を渡す | ✅（ただしシリアライズ可能な値だけ。関数や `Date` の一部は不可） |
| Client の中で Server を `import` する | ❌ |
| Client の `children` として Server を**渡す** | ✅ |

---

## 3-3. Client Component も「一度はサーバーで」描かれる

Step 0 で挙げた誤解の実物がここ。**`"use client"` は「サーバーで動かない」という意味ではない。**

```
Client Component のライフサイクル
  ① サーバーで一度レンダリングされ、HTML になる  ← ここでも動く！
  ② HTML がブラウザに届き、すぐ表示される
  ③ JS が届き、ハイドレーション（イベントを繋ぐ）
  ④ ここから onClick や useState が動きだす
```

だから `ShareButton` で `window` を触っているのは**イベントハンドラの中だけ**。

```tsx
export default function ShareButton() {
  // ✗ ここで読むと ① の段階（サーバー）で落ちる
  // const url = window.location.href

  async function handleClick() {
    // ○ ここは ④ 以降しか動かない = 必ずブラウザ
    await navigator.clipboard.writeText(window.location.href)
  }
}
```

「`window is not defined`」は Next.js で最も多いエラーのひとつで、原因はほぼこれ。
**コンポーネント本体は「サーバーでも動く場所」**、
**イベントハンドラと `useEffect` の中は「ブラウザだけの場所」** と覚える。

---

## 3-4. `loading.tsx` — 読み込み中の表示

`app/blog/loading.tsx` を置くだけで、`/blog` 配下のページが
サーバーでレンダリングされている間、これが自動で表示される。

```tsx
// src/app/blog/loading.tsx
export default function BlogLoading() {
  return <div>{/* 記事3件ぶんのスケルトン */}</div>
}
```

書いたのはこれだけ。`useState` も条件分岐も要らない。
Next.js が `page.tsx` を `<Suspense fallback={<BlogLoading />}>` で
**自動的に包んでくれる**からこう書ける。

### layout は待たされない

これが効く理由。`loading.tsx` は `layout.tsx` の**内側**に入る。

```
app/blog/layout.tsx（ヘッダー・「ブログ」の帯）  ← 先に届く
  └ <Suspense fallback={loading.tsx}>
       app/blog/page.tsx                        ← 準備できてから差し込まれる
     </Suspense>
```

開発サーバーで `/blog` の HTML を実際に取ってみると、両方が入っている。

```
実DOM に loading.tsx のスケルトン: 12 要素
実DOM に layout（ブログの帯）    : あり
実DOM に記事のリンク             : あり   ← 後から流れてきた分
```

「枠は即座に出て、中身だけ後から入る」という体験になる。

---

## 3-5. `<Suspense>` — 部分だけ後から流す

`loading.tsx` は**ページ全体**が単位。もっと細かくしたいときは自分で `<Suspense>` を書く。

記事詳細に「ほかの記事」を足したが、これは 1.5秒かかる。
本文まで 1.5秒待たせるのは損なので、この部分だけ切り出した。

```tsx
// src/app/blog/[slug]/page.tsx
<article>
  <h2>{post.title}</h2>
  <div>{/* 本文 */}</div>
  <ShareButton />

  <Suspense fallback={<RelatedPostsSkeleton />}>
    <RelatedPosts slug={post.slug} />    {/* ← 1.5秒かかる Server Component */}
  </Suspense>
</article>
```

`RelatedPosts` は `await` を持つ普通の async Server Component。
`<Suspense>` で包むと、**そこだけを切り離して後から送れる**。

### 実測: 本当に先に届いているか

開発サーバーで記事ページを 1回取得したときの数字。

```
TTFB  (最初の1バイト) = 0.025s   ← 本文はもう届いている
total (最後の1バイト) = 1.927s   ← 0.4s（記事）+ 1.5s（関連記事）
```

**最初の1バイトが 25ms で届き、レスポンスが終わるのは 1.9秒後。**
1つの HTTP レスポンスが、時間をかけて少しずつ流れてきている。これがストリーミング。

HTML の中身を見ると仕組みが分かる。

```
実DOM に skeleton      : 2 要素        ← まず fallback が入った状態で届く
実DOM に関連記事の <a>  : あり          ← 後から流れてきた本体
$RC（差し替えスクリプト）: 5 個          ← 届いた本体を fallback と入れ替える
```

React が `$RC` という小さな関数を仕込んでおき、
本体が流れてきた時点で fallback と差し替えている。

### 使い分け

| | `loading.tsx` | `<Suspense>` |
|---|---|---|
| 単位 | ルートセグメント全体 | 好きなコンポーネント |
| 書く量 | ファイルを置くだけ | 自分で包む |
| 使う場面 | ページ全体の待ちを埋める | **一部だけが遅いとき** |

「遅い処理を `<Suspense>` で囲って、ページの他の部分を人質にしない」が基本の考え方。

---

## 3-6. 正直な注記: 本番では今のところ出番がない

ここまでの `loading.tsx` と `<Suspense>` は、**開発サーバーでは動くが本番では出てこない**。
同じ URL を両方で測るとこうなる。

| | 開発（`next dev`） | 本番（`next start`） |
|---|---|---|
| レスポンス完了まで | 1.93 秒 | **0.002 秒** |
| 実DOM の skeleton | 2 要素（あとで差し替え） | **0 要素** |
| `$RC` 差し替えスクリプト | 5 個 | **0 個** |

理由は Step 2 の `generateStaticParams`。**このサイトは全ページ静的レンダリング**なので、
`npm run build` の時点で 1.5秒待ってから完成した HTML を作り置きしている。
訪問者が来たときにはもう完成しているので、待つ理由がない。

```
静的レンダリング: 待ち時間はビルド時に前払いされている
                 → 訪問者はローディングを見ない（見る必要がない）
動的レンダリング: リクエストごとに待つ
                 → ここで loading.tsx とストリーミングが効く
```

**「`loading.tsx` を置いたのに出ない」はバグではなく、静的レンダリングの証拠**。
Step 5 で検索機能（`searchParams`）を入れるとページが動的になり、
そこで初めて本番でもこれらが働きはじめる。

---

## 3-7. `error.tsx` — 例外を受け止める

`app/blog/error.tsx` を置くと、配下で投げられた例外を受け止めて代わりの画面を出す。

```tsx
'use client' // error.tsx は必ず Client Component

export default function BlogError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div>
      <h2>記事の読み込みに失敗しました</h2>
      {error.digest && <code>digest: {error.digest}</code>}
      <button type="button" onClick={() => retry()}>再試行</button>
    </div>
  )
}
```

### 押さえる点

**① `"use client"` が必須**
エラー画面には「再試行」ボタン、つまりイベントハンドラが必要なので、
仕組み上 Client Component でしかありえない。

**② prop は `retry`（`reset` ではない）**

| バージョン | prop |
|---|---|
| Next.js 15 まで | `reset` |
| **Next.js 16.3 以降** | **`retry`**（stable。`reset` も残るが `retry` が推奨） |

ネットの記事はほぼ `reset` で書かれている。`retry` は再取得までやり直すが、
`reset` は再取得せず境界を描き直すだけ、という違いがある。

**③ 置き場所で粒度が決まる**
`app/blog/error.tsx` に置いたので、`/blog` と `/blog/[slug]` の例外を捕まえる。
`not-found.tsx`（Step 2）と同じで、**例外は最も近い `error.tsx` まで浮上する**。
ヘッダーや「ブログ」の帯は残ったままエラー画面が出る。

### 動作確認したときに分かったこと

`page.tsx` にわざと `throw new Error(...)` を入れて確認したところ、
**HTTP ステータスは 200 のまま**だった。

理由は 3-5 のストリーミング。**レスポンスの先頭（layout）はもう送信済み**なので、
ステータスコードを 500 に変える余地がない。代わりに例外は、
後続のストリームにエラーとして流れてくる。

```
78:E{"digest":"4227161687","name":"Error","message":"動作確認用のわざとしたエラー", ...}
```

これを受け取ったブラウザ側の React が、`error.tsx` に切り替える。
つまり **`error.tsx` はクライアントで発動する**（だから `"use client"` が必須、とも言える）。

`curl` で見ても error.tsx の HTML は出てこないので、**確認はブラウザで行う**。

なお `message` が入っているのは開発時だけ。本番では汎用文に差し替えられ、
`digest`（上の `4227161687`）だけが残る。
これはサーバーのログに出る同じ digest と突き合わせるための ID で、
**エラーの中身を訪問者に漏らさない**ための仕組み。

---

## つまずきポイント

| 症状 | 原因 |
|---|---|
| `window is not defined` | コンポーネント本体で `window` を読んでいる。イベントハンドラか `useEffect` の中へ |
| `useState` でエラー | `"use client"` を書き忘れている |
| ブラウザに送る JS が妙に大きい | `"use client"` を親に付けて配下を巻き込んでいる。葉に近づける |
| Client から Server Component を import してエラー | 逆方向はできない。`children` として渡す形にする |
| `loading.tsx` が出ない | 静的レンダリングだから（3-6）。または `layout.tsx` 側でデータを取っている |
| `error.tsx` が出ない | `"use client"` が無い。または置き場所が例外を投げるセグメントの外 |
| `reset is not a function` | Next.js 16 では `retry`。古い記事の写しになっている |
| `onClick` を Server Component に書いてエラー | 関数は HTML に埋め込めない。その部分を Client Component へ |

---

## この Step のまとめ

- `"use client"` が必要なのは **フック**・**イベント**・**ブラウザ API** を使うとき
- **`"use client"` は境界の宣言**。配下が全部クライアントになるので、**葉に近い場所へ小さく付ける**
- **Client Component も初回はサーバーで描かれる**。
  `window` を触るのはイベントハンドラと `useEffect` の中だけ
- **Server の中に Client を置くのが基本形**。逆（Client から Server を import）はできない
- **`loading.tsx`** を置くだけで、Next.js が `page.tsx` を `<Suspense>` で包んでくれる。
  `layout.tsx` は待たされない
- **一部だけが遅いときは自分で `<Suspense>`**。TTFB 0.025s / total 1.93s で、
  1つのレスポンスが分割して流れていることが実測できる
- **静的レンダリングのページでは、これらは本番で出てこない**（待ち時間はビルド時に前払い済み）。
  Step 5 で動的になったら効きはじめる
- **`error.tsx` は Client 必須、prop は `retry`**（`reset` は古い）。
  ストリーミング中の例外なのでステータスは 200 のままで、切り替えはクライアントで起きる

→ 次は **[Step 4: 記事を投稿する](./04-server-actions.md)**
