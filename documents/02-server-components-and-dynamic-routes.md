# Step 2: 記事の一覧と詳細を表示する

> Step 1 の骨組みに、いよいよ**データ**を通す回。
> ここで **`async` な Server Component** と **動的ルート** という
> Next.js の2大機能が同時に出てくる。この Step が App Router の山場。

---

## この Step でやったこと

JSX に直書きしていた記事を、データとして切り出し、記事詳細ページを作った。

| URL | 画面 |
|---|---|
| `/blog` | 記事一覧（データから生成） |
| `/blog/hello-nextjs` など | **記事詳細。1つのファイルで全記事分を賄う** |
| 存在しない slug | 404 ページ |

```
src/
├── lib/
│   └── posts.ts            ← ★ データ層（型 + 取得関数）
└── app/blog/
    ├── layout.tsx
    ├── page.tsx            ← async にしてデータを取る
    ├── post-card.tsx       ← 一覧の1件分（コロケーション）
    ├── post-card.module.css
    └── [slug]/             ← ★ 動的ルート
        ├── page.tsx        ← 記事詳細 + generateMetadata + generateStaticParams
        ├── page.module.css
        ├── not-found.tsx   ← 記事が無いときの画面
        └── not-found.module.css
```

---

## 2-1. データ層を先に切り出す

まず `src/lib/posts.ts` に、型とデータと取得関数を置いた。

```ts
export type Post = {
  slug: string // URL に使う識別子。/blog/<slug> になる
  title: string
  date: string
  excerpt: string
  body: string
}

const posts: Post[] = [ /* 3件の記事 */ ]

/** 記事を新しい順に全件返す */
export async function getPosts(): Promise<Post[]> {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date))
}

/** slug に一致する記事を返す。見つからなければ undefined */
export async function getPost(slug: string): Promise<Post | undefined> {
  return posts.find((post) => post.slug === slug)
}
```

### なぜ `async` にするのか

中身はただの配列操作で、`await` するものは何もない。それでも `async` にしてある。

**呼び出し側から見た「形」を先に決めておくため。**

このリポジトリではデータの持ち方を Step ごとに差し替えていく。

```
Step 2: 定数配列        ← いま
Step 4: JSON ファイル   ← fs.readFile が入るので await が必要になる
Step 6: SQLite          ← DB クエリなので await が必要になる
```

最初から `async` にしておけば、**中身を差し替えてもページ側のコードは 1文字も変わらない**。
逆に同期関数で書き始めると、Step 4 で全ページの呼び出しを書き換えることになる。

> **`lib/` に置く理由**: `app/` の中はルーティングの世界なので、
> データアクセスのようなルートに紐づかないものは外に出す。
> Step 4 以降ここに `fs` や DB クライアントが入ってくるので、置き場所を分けておく。

---

## 2-2. `async` な Server Component でデータを取る

一覧ページはこれだけ。

```tsx
// src/app/blog/page.tsx
import { getPosts } from '@/lib/posts'
import PostCard from './post-card'

export default async function BlogPage() {
  const posts = await getPosts()

  if (posts.length === 0) {
    return <p>まだ記事がありません。</p>
  }

  return (
    <ul>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </ul>
  )
}
```

**コンポーネントが `async` で、中で `await` している。** これが App Router の核心。

### React だけならこう書いていた

```tsx
// React（CSR）の場合 — 全部クライアントで起きる
function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch('/api/posts')                    // ← この API も自分で作る必要がある
      .then((res) => res.json())
      .then(setPosts)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>読み込み中...</p>
  if (error) return <p>エラー</p>
  // ...
}
```

比べると消えたものが多い。

| React（CSR） | Server Component |
|---|---|
| `useState` 3つ（data / loading / error） | **不要**（`await` が終わってから描かれる） |
| `useEffect` | **不要** |
| `/api/posts` エンドポイント | **不要**（関数を直接呼ぶ） |
| ローディング表示の分岐 | **不要**（Step 3 で `loading.tsx` として扱う） |

**なぜ API が要らないのか**: このコードはサーバーで動いている。
DB やファイルは同じサーバー上にあるので、わざわざ HTTP を経由する意味がない。
「ブラウザからデータを取りに行く」から「サーバーで取ってから HTML を送る」に変わった結果、
API 層が中抜きされた。

### props の渡し方は React と同じ

`PostCard` は Step 1 で触れた**コロケーション**（`app/blog/` の隣に置く）にした。

```tsx
// src/app/blog/post-card.tsx
export default function PostCard({ post }: { post: Post }) {
  return (
    <li>
      <p>{post.date}</p>
      <h2>
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p>{post.excerpt}</p>
    </li>
  )
}
```

`"use client"` は付いていないので、これも Server Component。
**Server Component から Server Component へ props を渡している**だけで、
書き方は React と何も変わらない。`key` も React と同じ理由で必要。

---

## 2-3. 動的ルート `[slug]`

記事は 3件あるが、`page.tsx` は 1つしか書いていない。
フォルダ名を **角括弧** で囲むと、そこが可変部分になる。

```
app/blog/[slug]/page.tsx   →  /blog/hello-nextjs
                              /blog/folder-is-url
                              /blog/nested-layouts
```

`[slug]` の `slug` という名前は自由（`[id]` でも `[postId]` でもよい）。
その名前が、そのまま `params` のキーになる。

```tsx
export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params      // ← [slug] だから params.slug
  const post = await getPost(slug)
  // ...
}
```

### `params` は Promise（`await` 必須）

Step 0 の 0-8 で挙げた、Next.js 16 で一番よく踏む変更点がここ。

```tsx
const { slug } = await params    // ○
const { slug } = params          // ✗ Promise なので undefined になる
```

古い記事では `params.slug` と直接書いてあることが多い。**必ず `await`**。

### `PageProps<'/blog/[slug]'>` の効き方

`LayoutProps` と同じ、Next.js が自動生成するグローバル型。
**引数にルートのパスを書くだけで `params` の中身まで型が付く**。

```tsx
const { slug } = await params   // slug: string と推論される
const { id } = await params     // ✗ 型エラー。[slug] に id は無い
```

`[slug]` を `[id]` にリネームしたら、`params.slug` を使っている箇所が
そのまま型エラーになる。手で型を書いていたら気づけない種類のミス。

---

## 2-4. `notFound()` と `not-found.tsx`

`/blog/存在しないslug` にアクセスされたときの処理。

```tsx
import { notFound } from 'next/navigation'

const post = await getPost(slug)

if (!post) {
  notFound()      // ← ここで描画が止まる
}

// post は Post 型として扱える（undefined が絞り込まれている）
return <article>{post.title}</article>
```

`notFound()` は **例外を投げる関数**。だから呼んだ時点でそれ以降は実行されない。
TypeScript もそれを理解するので、この行より後では `post` が `undefined` でなくなる
（`if (!post) return <p>...</p>` と書いたときと同じ絞り込みが効く）。

代わりに描かれるのが `not-found.tsx`。

```tsx
// src/app/blog/[slug]/not-found.tsx
export default function PostNotFound() {
  return (
    <div>
      <h2>記事が見つかりません</h2>
      <Link href="/blog">← 記事一覧へ戻る</Link>
    </div>
  )
}
```

**置いた場所が効き方を決める。** `app/blog/[slug]/` に置いたので、
この 404 画面は `blog/layout.tsx` の内側に収まる
→ サイトのヘッダーも「ブログ」の帯もそのまま残ったまま 404 が出る。
`app/not-found.tsx` に置けばサイト全体の 404 になる。

### 自動で付いてくるもの

`notFound()` を呼ぶと、Next.js が 2つを勝手にやってくれる。

```bash
$ curl -i http://localhost:3000/blog/does-not-exist
HTTP/1.1 404 Not Found                          # ← ステータスコードが 404
...
<meta name="robots" content="noindex">          # ← 検索エンジンに載せない指示
```

`return <p>見つかりません</p>` と自分で書いた場合、
**見た目は 404 でもステータスコードは 200 のまま**になる。
検索エンジンやクローラーは「存在するページ」と解釈してしまうので、
「無い」ことを伝えるには `notFound()` を使う。

---

## 2-5. `generateMetadata` / `generateStaticParams` は Next.js の予約名

ここから出てくる2つの関数は、**自分で好きに名付けた関数ではない**。
Next.js があらかじめ決めている**特殊な名前**で、`page.tsx` から `export` しておくと
**Next.js が名前で見つけて、勝手に呼んでくれる**。

```tsx
// src/app/blog/[slug]/page.tsx — この3つを export しているだけ
export async function generateStaticParams() { /* ... */ }        // (1) どんな URL を作る？
export async function generateMetadata({ params }) { /* ... */ }  // (2) その URL の <title> は？
export default async function PostPage({ params }) { /* ... */ }  // (3) 本文
```

**このファイルのどこにも `generateStaticParams()` と呼び出すコードは書いていない。**
`export default` のコンポーネントを自分で `<PostPage />` と書かないのと同じで、
呼ぶのは Next.js 側。こちらは「決まった名前で置いておく」だけ。

Step 1 の `layout.tsx` / `page.tsx` / `not-found.tsx` と同じ発想が、
**ファイル名から export 名に降りてきた**もの、と捉えると分かりやすい。

| Next.js が認識するもの | 認識のされ方 |
|---|---|
| `layout.tsx` `page.tsx` `not-found.tsx` | **ファイル名**で見つける |
| `metadata` `generateMetadata` `generateStaticParams` | **export 名**で見つける |

だから綴りは1文字も変えられない。`generateMetaData`（`D` が大文字）や
`getStaticParams`（Pages Router 時代の `getStaticPaths` と混ざる）にすると、
**エラーも出ないまま、単に無視される**。効かないときはまず綴りを疑う。

### 2つの役割分担

同じ `[slug]/page.tsx` に並んでいるが、答えている質問が違う。

```
generateStaticParams()             generateMetadata()
        ↓                                  ↓
「[slug] にどんな値が入る？」        「その URL のタイトルと説明文は？」
        ↓                                  ↓
/blog/hello-nextjs                 <title>layout は入れ子になる | Next.js Playground</title>
/blog/folder-is-url                <meta name="description" content="ルートの layout の内側に...">
/blog/nested-layouts
```

前者が**どのページを作るか**、後者が**そのページの `<head>` に何を書くか**。

---

## 2-6. `generateMetadata` で記事ごとの `<title>`

Step 1 で書いた `export const metadata` の**動的版**。
固定のオブジェクトではなく、`params` を見てその場で組み立てる**関数**として export する。

```tsx
export async function generateMetadata({
  params,
}: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return { title: '記事が見つかりません' }
  }

  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

| | `export const metadata` | `export async function generateMetadata()` |
|---|---|---|
| 中身 | 固定のオブジェクト | 関数。`params` を見て組み立てられる |
| 使う場面 | 静的なページ（`/about` など） | 動的ルート、データに依存するタイトル |

`<title>` はページの見た目には出ないが、**ブラウザのタブ・検索結果・
SNS でシェアしたときのプレビュー**に出る。動的ルートを作ったら基本セットで書く。

### `title.template` で共通の接尾辞を付ける

ルートレイアウト側にこう書いておいた。

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'Next.js Playground',              // 子が title を出さないとき
    template: '%s | Next.js Playground',        // 子が title を出したとき
  },
}
```

結果、記事ページの `<title>` はこうなる。

```html
<title>layout は入れ子になる | Next.js Playground</title>
```

`%s` に子の `title` が入る。サイト名を全ページに書き足す必要がない。

---

## 2-7. `generateStaticParams` でビルド時に作り置き

動的ルートは、そのままだと**リクエストが来てから**サーバーで HTML を作る。
だが記事の一覧はビルド時に分かっているので、先に全部作っておける。

```tsx
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ slug: post.slug }))
}
```

これも「置いておくだけで Next.js が呼ぶ」関数で、
やっているのは「**`[slug]` にどんな値が入りうるか**」を Next.js に教えることだけ。
記事が 3件なら、返るのはこういう配列。

```js
[
  { slug: 'hello-nextjs' },
  { slug: 'folder-is-url' },
  { slug: 'nested-layouts' },
]
```

Next.js はこれを見て `/blog/hello-nextjs` … の 3ルートを把握し、
ビルド時にその HTML を作り置きする。
**オブジェクトのキー名は `[slug]` と揃える**（`[id]` なら `{ id: ... }`）。

### `npm run build` の出力で確認する

```
Route (app)
┌ ○ /
├ ○ /about
├ ○ /blog
└   /blog/[slug]
  ├ ● /blog/hello-nextjs
  ├ ● /blog/folder-is-url
  └ ● /blog/nested-layouts

○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses generateStaticParams)
```

**記事 3件が個別に列挙され、`●` が付いた。**
`generateStaticParams` を消すと `ƒ (Dynamic)` になり、この 3行が消える。
Step 0 の 0-3 で見た「静的レンダリング」を、自分の手で選んだのがこれ。

### 一覧に無い slug が来たら？

作り置きにない URL も、ちゃんと動く。

```bash
$ curl -o /dev/null -w "%{http_code}" http://localhost:3000/blog/nope
404
```

`generateStaticParams` は「**ビルド時に作っておくもの**」の指定で、
「これ以外を拒否する」という指定ではない。
一覧に無い slug はリクエスト時にその場でレンダリングされ、
今回は `getPost` が `undefined` を返すので `notFound()` に落ちる。

> Step 4 で記事を投稿できるようにすると、
> 「ビルド後に増えた記事」がこの経路で表示されることになる。

---

## つまずきポイント

| 症状 | 原因 |
|---|---|
| `params.slug` が `undefined` | `await params` していない。`params` は Promise |
| `Cannot read properties of undefined` | `notFound()` を `if` の中で呼んでいない、または `return` し忘れ |
| 404 なのにステータスが 200 | `notFound()` を使わず自分で「見つかりません」を返している |
| `not-found.tsx` が出ない | 置き場所が違う。`notFound()` を呼ぶセグメントかその親に置く |
| `<title>` が変わらない | export 名の綴り違い（`generateMetaData` など）。予約名なので1文字も変えられない |
| 記事を増やしても詳細が 404 | データ側に追加していない。`generateStaticParams` は一覧を作るだけ |
| `PageProps` が型エラー | 一度も `next dev` / `next build` していない（Step 1 と同じ） |

---

## この Step のまとめ

- **データ層は `lib/` に切り出し、最初から `async` にする** → 中身を差し替えてもページ側が壊れない
- **Server Component は `async` にできる**。`await` でデータを取れば、
  `useState` / `useEffect` / API エンドポイントがまとめて要らなくなる
- **`[slug]` フォルダで動的ルート**。1つの `page.tsx` が記事の数だけページになる
- **`params` は Promise。`await` が必須**（Next.js 16 で一番よく踏む）
- **`PageProps<'/blog/[slug]'>`** を使えば `params` の中身まで型が付く
- **`notFound()`** は例外を投げて描画を止め、**404 ステータスと `noindex` を自動で付ける**
- **`generateMetadata` / `generateStaticParams` は Next.js の予約名**。
  export 名で見つけて Next.js が呼ぶので、自分で呼び出すコードは書かない（綴り違いは黙って無視される）
- **`generateMetadata`** で記事ごとの `<title>`。`title.template` でサイト名を共通化
- **`generateStaticParams`** でビルド時に全記事を作り置き（`●` SSG）。
  一覧に無い URL もリクエスト時に処理される

→ 次は **[Step 3: Client Component を境界として足す](./03-client-components.md)**
