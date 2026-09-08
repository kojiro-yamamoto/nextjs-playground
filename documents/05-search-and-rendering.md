# Step 5: 検索とレンダリング・キャッシュ

> 検索機能を足す。ただし本題は検索そのものではなく、
> **`searchParams` を読んだ瞬間にページが「動的」に変わる**という事実。
> Step 3 で「本番では出番がない」と保留にしたローディングとストリーミングが、
> ここで実際に動きはじめる。

---

## この Step でやったこと

```
src/
├── lib/posts.ts              ← getPosts(query?) で絞り込みに対応
└── app/blog/
    ├── page.tsx              ← ★ searchParams を読む
    ├── search-form.tsx       ← ★ 'use client' — URL を書き換える検索欄
    └── search-form.module.css
```

`/blog?q=layout` のように URL にキーワードが乗り、一覧が絞り込まれる。

---

## 5-1. `searchParams` を読む

```tsx
// src/app/blog/page.tsx
export default async function BlogPage({ searchParams }: PageProps<'/blog'>) {
  const { q } = await searchParams          // ★ params と同じく Promise
  const query = typeof q === 'string' ? q : ''

  const posts = await getPosts(query)
  // ...
}
```

`params`（Step 2）と同じく **`searchParams` も Promise**。`await` が要る。

`typeof q === 'string'` で確かめているのは、
**同じキーが複数回現れると配列になる**ため（`?q=a&q=b` → `['a', 'b']`）。
型も `string | string[] | undefined` になっている。

絞り込み自体はデータ層の仕事にした。

```ts
// src/lib/posts.ts
export async function getPosts(query?: string): Promise<Post[]> {
  const sorted = (await readPosts()).sort(/* ... */)
  if (!query) return sorted

  const needle = query.toLowerCase()
  return sorted.filter((post) =>
    [post.title, post.excerpt, post.body].some((t) => t.toLowerCase().includes(needle)),
  )
}
```

---

## 5-2. URL を状態として使う

検索欄は Client Component だが、**検索語を `useState` で保持していない**。

```tsx
'use client'

export default function SearchForm() {
  const searchParams = useSearchParams()   // いまの ?q=... を読む
  const pathname = usePathname()
  const router = useRouter()

  function submit(text: string) {
    const params = new URLSearchParams(searchParams)
    if (text) params.set('q', text)
    else params.delete('q')

    router.replace(`${pathname}?${params.toString()}`)   // ← URL を書き換える
  }
  // ...
}
```

「入力 → state を更新 → 一覧を絞り込む」ではなく、
**「入力 → URL を書き換える → サーバーが絞り込んだ一覧を返す」**。

### なぜ URL に持たせるのか

| | `useState` で持つ | URL（`?q=`）に持つ |
|---|---|---|
| 検索結果を共有 | できない | **URL を送れば同じ画面** |
| ブラウザの戻る | 効かない | **効く** |
| リロード | 検索が消える | **残る** |
| サーバーで絞り込む | できない（データを全部クライアントへ送る必要がある） | **できる** |
| JS が無い環境 | 動かない | **動く**（ただの GET フォーム） |

最後の点は実際にそうなっていて、出力された HTML はこう。

```html
<form class="..." action="/blog" method="GET">
  <input type="search" name="q" ... />
```

**素の HTML フォームとして完成している。** JS が有効なら React が横取りして
`router.replace` で滑らかに遷移し、無効なら普通の GET 送信になる。
Step 4 の Server Actions と同じ、プログレッシブエンハンスメント。

### `replace` と `push` の違い

```tsx
router.replace(...)   // ○ 履歴を置き換える
router.push(...)      // ✗ 履歴が1件増える
```

検索欄は 1文字打つごとに URL が変わる。`push` にすると
「layout」と打っただけで履歴が 6件積まれ、**戻るボタンが使い物にならなくなる**。

### 打つたびにサーバーへ行かせない

入力が止まってから 300ms 後にだけ URL を書き換えている（デバウンス）。

```tsx
const [text, setText] = useState(searchParams.get('q') ?? '')

useEffect(() => {
  if (text === (searchParams.get('q') ?? '')) return

  const id = setTimeout(() => {
    startTransition(() => router.replace(`${pathname}?${params}`))
  }, 300)

  return () => clearTimeout(id)
}, [text, searchParams, pathname, router])
```

ここでの `useState` は**入力欄の見た目のため**であって、検索の状態ではない。
検索の状態はあくまで URL 側にある。

`startTransition` で包むと、**切り替え中も今の一覧を表示したまま**にできる
（`loading.tsx` のスケルトンに戻らない）。代わりに `isPending` が `true` になるので、
「検索中…」の小さな表示を出している。

---

## 5-3. ページが「動的」に変わった

`npm run build` の出力が Step 4 から変わった。

```
Route (app)
┌ ○ /
├ ○ /about
├ ƒ /blog                     ← ★ ○ から ƒ に変わった
├   /blog/[slug]
│ ├ ● /blog/hello-nextjs
│ ├ ● /blog/folder-is-url
│ └ ● /blog/nested-layouts
└ ○ /blog/new

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

**3種類の記号が同時に出ている。** これがこの Step の要点。

| 記号 | 意味 | いつ HTML が作られるか |
|---|---|---|
| `○` Static | 静的 | **ビルド時**に 1回 |
| `●` SSG | 静的（動的ルート） | **ビルド時**、`generateStaticParams` の数だけ |
| `ƒ` Dynamic | 動的 | **リクエストごと** |

### 何をすると動的になるのか

**「リクエストが来ないと分からない情報」を読むと動的になる。**
公式には **Request-time APIs** と呼ばれ、4つある。

| API | 内容 |
|---|---|
| **`searchParams`** | URL のクエリ（← 今回これを使った） |
| `cookies()` | リクエストの Cookie |
| `headers()` | リクエストヘッダー |
| `draftMode()` | 下書きプレビューの状態 |

`/blog?q=layout` の `q` は、ビルド時には知りようがない。
だから Next.js は「このページは作り置きできない」と判断し、自動で `ƒ` に切り替えた。

> **`export const dynamic = 'force-dynamic'` は書いていない。**
> 明示的な指定もできるが、**まずはコードの内容から自動で決まる**のが基本。
> 「なぜか動的になった」ときは、Request-time API をどこかで読んでいないか探す。

---

## 5-4. Step 3 の宿題: 本番でストリーミングが効きはじめた

Step 3 の 3-6 で「`loading.tsx` もストリーミングも、本番では出番がない」と書いた。
理由は全ページ静的で、待ち時間がビルド時に前払いされていたから。

`/blog` が動的になった今、同じ URL を本番ビルドで測るとこうなる。

| | Step 3 時点（`○` 静的） | Step 5 時点（`ƒ` 動的） |
|---|---|---|
| `/blog` のレスポンス完了 | 0.002 秒 | **0.406 秒**（`getPosts` の待ち時間） |
| 実DOM の `loading.tsx` スケルトン | 0 要素 | **20 要素** |
| `$RC`（差し替えスクリプト） | 0 個 | **2 個** |

**本番でも `loading.tsx` が出て、ストリーミングが起きている。**
書いたコードは Step 3 のまま 1行も変えていない。
変わったのは「このページが動的になった」ことだけ。

```
静的（○ / ●）  : 待つのはビルド。訪問者は待たない → loading.tsx の出番なし
動的（ƒ）      : 訪問者ごとに待つ         → loading.tsx とストリーミングが効く
```

比較のため、静的なままの `/about` は本番で **0.007 秒**。
同じサーバー上で、ページごとに挙動が違うことが数字で見える。

---

## 5-5. `revalidatePath` の必要性も変わった

Step 4 では、`revalidatePath('/blog')` を消すと投稿しても一覧が更新されなかった。
`/blog` が動的になった今、同じ実験をするとこうなる。

| | 投稿前の `/blog` | 投稿後の `/blog` |
|---|---|---|
| Step 4（`/blog` が `○`）・revalidate あり | 3 件 | 4 件 ✅ |
| Step 4（`/blog` が `○`）・revalidate **なし** | 3 件 | **3 件** ❌ |
| Step 5（`/blog` が `ƒ`）・revalidate あり | 3 件 | 4 件 ✅ |
| Step 5（`/blog` が `ƒ`）・revalidate **なし** | 3 件 | **4 件** ✅ |

**動的ページには、そもそも捨てるキャッシュが無い。**
毎回サーバーで作り直しているので、`revalidatePath` を呼んでも呼ばなくても最新になる。

### では消していいのか → 消さない

コードは `revalidatePath('/blog')` を残してある。理由は 2つ。

1. **レンダリング方式は変わりうる**。将来 `searchParams` を使わない形に直したら、
   `/blog` は `○` に戻る。そのとき revalidate が無いと、また同じバグが再発する
2. **動的ページに対しては、実質コストが無い**

> **考え方**: `revalidatePath` は「このデータを表示しているページ名」を宣言するもの。
> **そのページが静的か動的かは、宣言する側が気にすることではない。**
> データを変えたら、そのデータを出しているパスを書く。それで正しくなる。

なお `/blog/[slug]` は `●` のままなので、**記事の編集機能を作るときは**
`revalidatePath('/blog/[slug]', 'page')` が必要になる（動的セグメントを含むパスには
`'page'` / `'layout'` の指定が要る）。

---

## 5-6. 動的にすると何を失うのか

`ƒ` は便利だが、代償がある。

| | 静的（`○` `●`） | 動的（`ƒ`） |
|---|---|---|
| 速度 | **0.007 秒**（ファイルを返すだけ） | 0.406 秒（毎回サーバーで生成） |
| サーバー負荷 | ほぼゼロ | アクセス数に比例 |
| CDN | **そのまま載る** | 載らない（毎回オリジンまで来る） |
| 落ちにくさ | **高い** | サーバーが落ちれば止まる |

だから**「なんとなく動的」は避ける**。実際、このサイトでも:

- `/` `/about` `/blog/new` … 内容が固定 → 静的のまま
- `/blog/[slug]` … 記事はビルド時に分かる → `generateStaticParams` で静的
- `/blog` … 検索がある → ここだけ動的

**ページ単位で選べる**のが Next.js の強みなので、
「全部動的」にしてしまうとその強みを捨てることになる。

> より進んだ手として、**静的な枠だけ先に返し、動的な部分だけ後から流す**
> という仕組み（Cache Components / `use cache`）もある。
> このリポジトリでは扱わないが、「静的か動的か」の二択ではない、という頭は持っておくとよい。

---

## つまずきポイント

| 症状 | 原因 |
|---|---|
| `searchParams.q` が `undefined` | `await searchParams` していない。`params` と同じく Promise |
| `q` の型が合わない | `string \| string[] \| undefined`。`typeof q === 'string'` で絞る |
| 検索するたび履歴が増えて戻れない | `router.push` を使っている。`router.replace` にする |
| 1文字ごとにサーバーへ行って重い | デバウンスしていない |
| 意図せず全ページが `ƒ` になった | `layout.tsx` で `cookies()` などを読んでいる。layout は全ページに効く |
| `useSearchParams` でビルドエラー | 静的なページで使うと `<Suspense>` で包むよう求められる。動的ページなら不要 |
| 動的にしたのにデータが古い | `fetch` 側のキャッシュ。ページの動的／静的とデータのキャッシュは別の話 |

---

## この Step のまとめ

- **`searchParams` も `params` と同じく Promise**。`await` が要り、値は `string \| string[]`
- **検索語は `useState` ではなく URL に持たせる**
  → 共有・戻る・リロード・サーバー側での絞り込み・JS 無し動作が全部ついてくる
- URL の書き換えは **`router.replace`**（`push` だと履歴が汚れる）。入力はデバウンスする
- **Request-time API（`searchParams` / `cookies()` / `headers()` / `draftMode()`）を読むと、
  そのページは自動で動的（`ƒ`）になる**。明示的な設定は要らない
- `next build` の **`○` / `●` / `ƒ`** が、そのページの HTML がいつ作られるかを示す
- **動的になったことで、Step 3 で書いた `loading.tsx` とストリーミングが本番でも効きだした**
  （0.002秒 → 0.406秒、スケルトン 0 → 20 要素）。コードは 1行も変えていない
- **`revalidatePath` は動的ページには効果が見えない**が、宣言として残しておく
- 動的は**速度・CDN・落ちにくさ**を手放す。必要なページだけを動的にする

→ 次は **[Step 6: SQLite に保存してデプロイする](./06-sqlite-and-deploy.md)**
