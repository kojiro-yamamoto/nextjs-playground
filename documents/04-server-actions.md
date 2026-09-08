# Step 4: 記事を投稿する

> ここまでは**読む**だけだった。この Step で初めて**書く**。
> テーマは **Server Actions**・`useActionState`・`revalidatePath`、
> そしてデータの置き場所を定数から **JSON ファイル**へ移すこと。

---

## この Step でやったこと

ブラウザから記事を投稿できるようにした。

```
data/posts.json                     ← ★ データの保存先（定数配列から移動）
src/
├── lib/
│   ├── posts.ts                    ← 中身を JSON ファイル読み書きに差し替え
│   └── actions.ts                  ← ★ 'use server' — 投稿処理
└── app/blog/
    ├── page.tsx                    ← 「+ 新しい記事」への導線を追加
    └── new/
        ├── page.tsx                ← /blog/new（Server Component）
        └── post-form.tsx           ← ★ 'use client' — useActionState を使うフォーム
```

> **`/blog/new` と `/blog/[slug]` は衝突しないのか？**
> しない。**静的セグメント（`new`）が動的セグメント（`[slug]`）より優先される**。
> ただし裏を返すと `new` という slug の記事は作れないので、
> 予約語として弾いている（`actions.ts` の `RESERVED_SLUGS`）。

---

## 4-1. データを JSON ファイルへ移す

Step 2 で「データ層は最初から `async` にしておく」と書いた理由が、ここで回収される。

```ts
// src/lib/posts.ts — 中身は全部書き換わった
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DATA_FILE = path.join(process.cwd(), 'data', 'posts.json')

async function readPosts(): Promise<Post[]> {
  const json = await readFile(DATA_FILE, 'utf-8')
  return JSON.parse(json) as Post[]
}

export async function getPosts(): Promise<Post[]> {
  const posts = await readPosts()
  return posts.sort((a, b) => b.date.localeCompare(a.date))
}
```

**`page.tsx` 側は 1文字も変えていない。** 呼び出し側から見た形（`await getPosts()`）が
同じなので、定数配列 → ファイル読み込みの差し替えが内側で完結した。

`process.cwd()` はプロジェクトのルートを指す。
`@/lib/posts` のようなエイリアスは TypeScript の `import` 用なので、
**ファイルパスには使えない**点に注意。

書き込み用に 2つ足した。

```ts
export async function slugExists(slug: string): Promise<boolean>  // 重複チェック
export async function addPost(post: Post): Promise<void>          // 1件追加して保存
```

---

## 4-2. Server Action とは

投稿処理は `src/lib/actions.ts` に書いた。**ファイルの先頭の 1行**がすべて。

```ts
'use server'   // ← このファイルの export は全部 Server Action になる

export async function createPost(prevState, formData: FormData) {
  // ...検証...
  await addPost(post)
  revalidatePath('/blog')
  redirect(`/blog/${slug}`)
}
```

これをフォームの `action` に**そのまま渡す**。

```tsx
<form action={formAction}>
  <input name="title" />
  <textarea name="body" />
  <button type="submit">投稿する</button>
</form>
```

### 何が消えたか

React でフォームを作ると、普通はこうなっていた。

```tsx
// 従来（React + 自作 API）
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()                          // ← 必須の定型文
  setLoading(true)
  const res = await fetch('/api/posts', {     // ← この API も自分で作る
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  })
  if (!res.ok) { setError(...) }
  setLoading(false)
  router.push(`/blog/${slug}`)
}
```

| 従来 | Server Actions |
|---|---|
| `/api/posts` エンドポイント | **不要** |
| `fetch` の記述 | **不要** |
| `e.preventDefault()` | **不要** |
| JSON への変換 / 復元 | **不要**（`FormData` がそのまま届く） |
| `name` 属性と state の二重管理 | **不要**（`name` だけでよい） |

**フォームとサーバー関数が直結する**。間にあった HTTP のやりとりは、
Next.js と React が裏で組み立てている。

### 裏で何が起きているか

`curl` で実際の通信を見ると、投稿成功時のレスポンスはこうだった。

```
HTTP/1.1 303 See Other
Location: /blog/added-in-prod
```

`redirect()` が 303 リダイレクトになっている。
`'use server'` は魔法ではなく、**POST リクエストを1本張る仕組みの糖衣**だと分かる。

---

## 4-3. `useActionState` で検証エラーを返す

「タイトルが空」のような**想定内のエラー**は、`throw` してはいけない。
`throw` すると Step 3 で作った `error.tsx` が出てしまい、
入力した内容も全部消える。

> **原則**: 想定内のエラーは**戻り値**で返す。想定外の例外だけ `throw` する。

```ts
export type CreatePostState = {
  errors?: { title?: string; slug?: string; body?: string }
  values?: { title: string; slug: string; body: string }  // 入力し直さずに済むよう返す
}

export async function createPost(
  _prevState: CreatePostState,     // ← 第1引数は「前回の状態」
  formData: FormData,
): Promise<CreatePostState> {
  const errors = {}
  if (!title) errors.title = 'タイトルを入力してください'
  if (!SLUG_PATTERN.test(slug)) errors.slug = '半角英小文字・数字・ハイフンだけが使えます'
  else if (await slugExists(slug)) errors.slug = 'その slug はすでに使われています'

  if (Object.keys(errors).length > 0) {
    return { errors, values: { title, slug, body } }   // ← 保存せずに戻す
  }
  // ...
}
```

受け取る側が `useActionState`。

```tsx
'use client'
import { useActionState } from 'react'

const [state, formAction, isPending] = useActionState(createPost, {})
//     ↑ 戻り値   ↑ formに渡す   ↑ 送信中か

<form action={formAction}>
  <input name="title" defaultValue={state.values?.title} />
  {state.errors?.title && <p className={styles.error}>{state.errors.title}</p>}

  <button type="submit" disabled={isPending}>
    {isPending ? '投稿中…' : '投稿する'}
  </button>
</form>
```

3つ返ってくるのが要点。

| | 中身 |
|---|---|
| `state` | Server Action が `return` した値。ここでは検証エラーと入力値 |
| `formAction` | `<form action>` に渡すラッパー。直接アクションを渡すと `state` が繋がらない |
| `isPending` | 送信中フラグ。ボタンの二度押し防止と表示切り替えに使う |

`defaultValue={state.values?.title}` を入れているのがポイント。
これが無いと、検証に失敗したときに入力欄が空に戻ってしまう。

### 実際に確かめた

```
空のまま送信 → 200 OK
  「タイトルを入力してください」「slug を入力してください」「本文を入力してください」
  JSON ファイルの件数: 3 のまま（保存されていない）

slug に "Bad Slug!" → 「半角英小文字・数字・ハイフンだけが使えます」
slug に "new"       → 「"new" は予約語のため使えません」
```

---

## 4-4. `revalidatePath` — これが無いと画面が古いまま

保存したあとに 1行呼んでいる。

```ts
await addPost(post)
revalidatePath('/blog')     // ← 一覧のキャッシュを捨てる
redirect(`/blog/${slug}`)
```

**この 1行が無いとどうなるか**を、本番ビルドで比較した。

| | 投稿前の `/blog` | 投稿後の `/blog` | JSON ファイル |
|---|---|---|---|
| `revalidatePath` **あり** | 3 件 | **4 件** ✅ | 4 件 |
| `revalidatePath` **なし** | 3 件 | **3 件** ❌ | 4 件 |

**データは保存されているのに、画面には出てこない。**

理由は Step 3 の 3-6 で見たとおり。`/blog` は静的レンダリングなので、
`npm run build` の時点で作られた HTML が配信され続ける。
`revalidatePath('/blog')` は Next.js に
**「そのページの作り置きはもう古い。次のアクセスで作り直せ」**と伝える命令。

```
revalidatePath('/blog')
    ↓
次に /blog が開かれたとき、page.tsx を再実行して HTML を作り直す
```

> **どこまで書けばいいか**: データを変えたら、
> **そのデータを表示しているページ全部**を revalidate する。
> ここでは一覧だけだが、Step 5 で検索ページが増えたら対象も増える。

### `redirect` の位置に注意

`redirect()` は `notFound()`（Step 2）と同じく**例外を投げて処理を打ち切る**。
だから `try/catch` の中で呼ぶと、自分の catch が redirect を握りつぶしてしまう。

```ts
try {
  await addPost(post)
  redirect('/blog')      // ✗ catch に吸われてリダイレクトしない
} catch (e) { /* ... */ }
```

**`redirect` は必ず `try` の外**で呼ぶ。

---

## 4-5. JavaScript が無くても動く

今回の動作確認は、ブラウザではなく `curl` から**フォームを普通に POST しただけ**。
それで投稿が成功した。

理由は、Next.js が生成した HTML にこういう hidden input が入っているから。

```html
<form action="" encType="multipart/form-data" method="POST">
  <input type="hidden" name="$ACTION_REF_1" />
  <input type="hidden" name="$ACTION_1:0" value='{"id":"600605d5d4...","bound":"$@1"}' />
  <input type="hidden" name="$ACTION_KEY" value="kdb99b49c..." />
```

**JS が読み込まれる前でも、素の HTML フォームとして送信できる形になっている。**
JS が有効なときは React が横取りしてページ遷移なしで送り、
無効なときは普通のフォーム送信として 303 リダイレクトが返る。

これが**プログレッシブエンハンスメント**。
`onSubmit` + `fetch` で書いていた頃は、JS が動かなければ何もできなかった。

---

## 4-6. Server Action は公開エンドポイント

4-5 は便利さの話だが、**裏返すと注意点**でもある。

`curl` から直接叩けたということは、**画面を経由しなくても実行できる**ということ。
フォームの `<input>` に `maxlength` を付けても、`disabled` にしても、
**それはブラウザ側の話**で、アクション自体は誰でも呼べる。

```
❌「フォームで弾いているから大丈夫」
✅「アクションの中で弾いているから大丈夫」
```

だから今回、検証は全部 `actions.ts` の**中**に書いてある。
将来ログインを付けるなら、認証チェックも同じく関数の先頭に書く。

```ts
export async function createPost(prevState, formData) {
  'use server'
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')   // ← まずここ
  // ...
}
```

**Server Action は「関数」に見えるが、正体は POST エンドポイント**。
API ルートを書くときと同じ警戒心で扱う。

---

## 4-7. JSON ファイルの限界

いまの仕組みには弱点がある。次の Step へ進む理由でもあるので、書き残しておく。

| 問題 | 内容 |
|---|---|
| **書き込めない環境がある** | Vercel などのサーバーレスはファイルシステムが読み取り専用。ローカルでしか動かない |
| **同時書き込みに弱い** | 2人が同時に投稿すると、片方の記事が消えうる（読んで→足して→丸ごと上書き、のため） |
| **全件読み込み** | 1件取るのに毎回ファイル全体を読んで JSON にしている |
| **検索できない** | 絞り込みも並べ替えも、全部メモリ上でやるしかない |

Step 6 で SQLite に置き換えると全部解決する。
そのときも `lib/posts.ts` の中だけを書き換えれば済む——というのが 4-1 の設計。

> **なお**: ローカルで記事を投稿すると `data/posts.json` が書き換わるので、
> `git status` に差分として出る。学習用リポジトリなのでそのままコミットしてよい。

---

## つまずきポイント

| 症状 | 原因 |
|---|---|
| `Functions cannot be passed directly to Client Components` | `'use server'` を書き忘れている |
| 保存はされるのに一覧が古いまま | `revalidatePath` を呼んでいない（4-4） |
| リダイレクトされない | `redirect()` を `try/catch` の中で呼んでいる |
| 検証エラーで入力が全部消える | `defaultValue={state.values?.…}` を渡していない |
| `state` がいつも初期値のまま | `<form action={createPost}>` と直接渡している。`formAction` を渡す |
| エラー画面（error.tsx）が出てしまう | 想定内のエラーを `throw` している。戻り値で返す |
| `useActionState` でエラー | フォーム側に `'use client'` が無い |
| `Module not found: fs` | `fs` を使うファイルが Client Component から import されている |

---

## この Step のまとめ

- データ層は **`lib/posts.ts` の中だけ**を書き換えた。ページ側は無変更
  （Step 2 で `async` にしておいた効果）
- **`'use server'`** を書いた関数は、フォームの `action` に直接渡せる
  → API・`fetch`・`preventDefault` がまとめて要らなくなる
- **想定内のエラーは `throw` せず戻り値で返す**。`throw` は `error.tsx` 行き
- **`useActionState`** が `[state, formAction, isPending]` を返す。
  `formAction` を `<form action>` に渡すのが接続点
- **`revalidatePath` が無いと、保存できても画面は古いまま**（実測: 3件 → 3件）
- Server Action は **JS 無しでも動く**（プログレッシブエンハンスメント）が、
  同時に **誰でも直接叩ける POST エンドポイント**。検証と認可は必ず関数の中で
- JSON ファイルは書き込み環境・同時実行・検索に弱い → Step 6 で SQLite へ

→ 次は **[Step 5: 検索とレンダリング・キャッシュ](./05-search-and-rendering.md)**
