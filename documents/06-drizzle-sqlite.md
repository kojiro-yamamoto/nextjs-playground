# Step 6: SQLite に保存する

> 最後の Step。保存先を JSON ファイルから **SQLite** に移し、
> **Drizzle ORM** でスキーマ・マイグレーション・クエリを扱う。
>
> そして Step 2 から引っ張ってきた伏線——
> **「データ層の中身を差し替えても、ページ側は書き換えなくていい」**——を回収する。

---

## この Step でやったこと

```
drizzle/                        ← ★ 生成されたマイグレーション
└── 20260908023413_grey_orphan/
    ├── migration.sql
    └── snapshot.json
data/
├── posts.json                  ← 役割が「保存先」から「初期データ」に変わった
└── blog.db                     ← ★ SQLite の実体（Git 管理外）
drizzle.config.ts               ← ★ drizzle-kit の設定
src/
├── db/
│   ├── schema.ts               ← ★ テーブル定義（唯一の正）
│   ├── index.ts                ← ★ 接続
│   └── seed.mts                ← ★ posts.json を DB に投入
└── lib/posts.ts                ← 中身を Drizzle に差し替え（3度目）
```

導入したもの:

```bash
npm install drizzle-orm@rc
npm install -D drizzle-kit@rc
```

| パッケージ | 役割 |
|---|---|
| `drizzle-orm` | アプリから使うクエリビルダ + 型 |
| `drizzle-kit` | スキーマから SQL を生成し、適用する CLI |

**SQLite のドライバは入れていない。** Node.js に組み込みの
[`node:sqlite`](https://nodejs.org/api/sqlite.html) をそのまま使うため。

### `node:sqlite` を使う

SQLite を Node から触るには、これまで `better-sqlite3` のような
外部パッケージが必要だった。それが Node 22 で標準モジュールとして入り、
**Node 24 では実験フラグも警告も無しで使える**。

```ts
import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync('data/blog.db')
```

Drizzle 側もこれに対応していて、`drizzle-orm/node-sqlite` から繋げる。

| | 外部ドライバ（`better-sqlite3`） | 組み込み（`node:sqlite`） |
|---|---|---|
| 依存パッケージ | 本体 + `@types/better-sqlite3` | **不要** |
| ネイティブビルド | 必要（`.node` バイナリ） | **不要** |
| `next.config.ts` の設定 | `serverExternalPackages` が必要 | **不要** |
| Node のバージョン | 制約ゆるい | **22 以降**（24 推奨） |

依存が減り、設定も減る。**このリポジトリの条件では組み込みの方が素直**。

> **⚠ バージョンについて**
> `node:sqlite` 対応は **Drizzle v1 系**（現時点では `1.0.0-rc.4`）に入っている。
> `latest`（0.45.2）には `drizzle-orm/node-sqlite` が存在しないので、
> `@rc` を明示してインストールしている。安定版が出たら `@rc` を外せばよい。

---

## 6-1. なぜ ORM を挟むのか

SQLite は `node:sqlite` だけでも使える。それでも Drizzle を挟む理由は**型**。

```ts
// 素のドライバ: 返ってくる型が any。タイポしても気づけない
const rows = db.prepare('select * from posts').all()
rows[0].titel     // ✗ エラーにならない

// Drizzle: テーブル定義から型が付く
const rows = await db.select().from(posts)
rows[0].titel     // ✗ エディタが即座に赤線
```

TypeScript を使う理由（Step 0 の 0-6）が、そのままデータベースにも及ぶ、ということ。

> **Drizzle と Prisma**: 同じ用途のツールに Prisma がある。
> Prisma は独自のスキーマ言語（`.prisma`）とコード生成が必要なのに対し、
> **Drizzle はスキーマも TypeScript で書き、SQL に近い書き味**という違いがある。
> ここでは後者を選んだ。

---

## 6-2. スキーマ = 唯一の正

`src/db/schema.ts` にテーブルを定義する。

```ts
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  slug: text('slug').primaryKey(),
  title: text('title').notNull(),
  date: text('date').notNull(),   // SQLite に日付型は無いので TEXT
  excerpt: text('excerpt').notNull(),
  body: text('body').notNull(),
})

// ★ 型を手で書かない。テーブル定義から生成する
export type Post = typeof posts.$inferSelect     // SELECT で返る行の型
export type NewPost = typeof posts.$inferInsert  // INSERT に渡す値の型
```

ここがこの Step で一番大事な考え方。

```
              schema.ts（TypeScript で書いたテーブル定義）
                 ↙                        ↘
    マイグレーション SQL              TypeScript の型
    （drizzle-kit が生成）           （$inferSelect が生成）
```

**1箇所を直せば、DB の構造と型の両方が追従する。**
Step 2 で手書きした `type Post = { slug: string; ... }` は、もう要らない。

```ts
// src/lib/posts.ts — 型はスキーマから来たものをそのまま流す
export type { Post } from '@/db/schema'
```

これで `post-card.tsx` などの `import type { Post } from '@/lib/posts'` は
一切変更せずに済んでいる。

### `slug` を主キーにした

数値の `id` ではなく `slug` を主キーにしている。URL と 1対1 で対応し、
「主キーは数値でなければならない」わけではないため。
（実務では `id` を別に持ち、`slug` に UNIQUE を張ることが多い。）

---

## 6-3. マイグレーション

スキーマを書いただけでは DB は変わらない。**差分を SQL に落として、適用する**。

```bash
npm run db:generate   # schema.ts → SQL を生成
npm run db:migrate    # 生成された SQL を DB に適用
```

`db:generate` が吐いたのがこれ。

```sql
-- drizzle/20260908023413_grey_orphan/migration.sql
CREATE TABLE `posts` (
	`slug` text PRIMARY KEY,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL
);
```

**生成された SQL はコミットする。** これがあることで:

- チームの全員が同じ手順で同じ構造の DB を作れる
- 変更の履歴が Git に残る（「いつカラムを足したか」が追える）
- 適用済みかどうかを Drizzle が `__drizzle_migrations` テーブルで管理する

```bash
$ npm run db:migrate
Using 'node:sqlite' driver for database querying     ← 組み込みドライバを自動で選んでいる
[✓] migrations applied successfully!

$ node -e "…select name from sqlite_master where type='table'"
[ { name: '__drizzle_migrations' }, { name: 'posts' } ]
```

### 今後カラムを足すときは

```
① schema.ts に1行足す
② npm run db:generate   → drizzle/0001_xxx.sql が増える
③ npm run db:migrate    → DB に適用される
```

`db:push`（SQL を残さず直接反映）というコマンドもあるが、
**履歴が残らない**ので、試行錯誤の段階だけに使うもの。

> Drizzle のバージョンを上げたときに
> `Your migrations folder format is outdated` と言われることがある。
> そのときは **`npx drizzle-kit up`** を実行すると、
> 生成済みのマイグレーションを新しい形式に変換してくれる。

---

## 6-4. 接続と、開発中の注意

```ts
// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-sqlite'
import { DatabaseSync } from 'node:sqlite'

const globalForDb = globalThis as unknown as { sqlite?: DatabaseSync }

const sqlite = globalForDb.sqlite ?? new DatabaseSync(DB_FILE)

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqlite = sqlite
}

export const db = drizzle({ client: sqlite })
```

`globalThis` に載せているのが要点。

開発サーバーはファイルを保存するたびにモジュールを読み直す（Fast Refresh）。
素直に `new Database(...)` と書くと、**保存のたびに接続が増え続ける**。
`globalThis` はモジュールの再読み込みでもリセットされないので、ここに退避しておく。
本番はモジュールが1回しか読まれないので不要。

`next.config.ts` は**何も足していない**。`node:sqlite` は Node の組み込みなので、
バンドラが触ろうとしないため。

> **もし外部ドライバを使っていたら**
> `better-sqlite3` のようなネイティブモジュール（`.node` バイナリ）は、
> バンドラがまとめようとすると壊れる。その場合は
> `next.config.ts` に `serverExternalPackages: ['better-sqlite3']` を足して、
> 「バンドルせず Node に直接読ませて」と指定する必要がある。
> 「動くはずのライブラリが Next.js の中でだけ動かない」ときは、まずここを疑う。

---

## 6-5. 初期データの投入（シード）

`data/posts.json` は消していない。**役割が変わった**。

```
Step 4-5: posts.json = 保存先そのもの
Step 6  : posts.json = DB を作り直すときの初期データ
```

投入スクリプトは `src/db/seed.mts`。

```ts
import { drizzle } from 'drizzle-orm/node-sqlite'
import { DatabaseSync } from 'node:sqlite'
import { type NewPost, posts } from './schema.ts'

// アプリ側と違い使い捨てなので、接続はここで開いて閉じる
const sqlite = new DatabaseSync(path.join(process.cwd(), 'data', 'blog.db'))
const db = drizzle({ client: sqlite })

const seed: NewPost[] = JSON.parse(await readFile(JSON_FILE, 'utf-8'))

await db.delete(posts)          // 何度実行しても同じ結果になるように
await db.insert(posts).values(seed)

sqlite.close()
```

**Node 24 は TypeScript をそのまま実行できる**ので、`ts-node` などは要らない。

```json
"db:seed": "node src/db/seed.mts"
```

拡張子を `.mts` にしてあるのは、Node に「これは ES モジュール」と明示するため。
また Node が素で実行するときは **import に拡張子が必須**なので、
このファイル内だけ `from './schema.ts'` と書いている。

### `data/blog.db` はコミットしない

`.gitignore` に入れてある。理由は、**マイグレーションとシードから完全に再現できる**から。
バイナリファイルは差分が読めず、コンフリクトも解決できない。

```bash
npm run db:setup   # = db:migrate && db:seed。クローン直後はこれ1つ
```

---

## 6-6. クエリを書く — そして伏線の回収

`src/lib/posts.ts` を Drizzle に書き換えた。

```ts
export async function getPosts(query?: string) {
  const where = query
    ? or(
        like(posts.title, `%${query}%`),
        like(posts.excerpt, `%${query}%`),
        like(posts.body, `%${query}%`),
      )
    : undefined

  return db.select().from(posts).where(where).orderBy(desc(posts.date))
}

export async function getPost(slug: string) {
  const rows = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1)
  return rows.at(0)
}
```

`select` / `from` / `where` / `orderBy` と、**SQL とほぼ同じ語順**で書ける。
`eq` `ne` `like` `or` `desc` は Drizzle が用意している比較演算子。

### Step 5 の検索が「本物」になった

```ts
// Step 5（JSON）: 全件をメモリに読んでから JS で絞り込む
const posts = await readPosts()
return posts.filter((p) => p.title.toLowerCase().includes(needle))

// Step 6（SQLite）: 絞り込みを DB に任せる
return db.select().from(posts).where(like(posts.title, `%${query}%`))
```

記事が 3件なら差は無いが、10万件なら決定的に違う。
**「全部読んでから捨てる」から「必要な分だけ取り出す」に変わった。**

### ★ 伏線の回収: ページ側は一度も書き換えていない

Step 2 でこう書いた。

> 最初から `async` にしておけば、中身を差し替えてもページ側のコードは 1文字も変わらない。

実際どうなったか。

| | データの中身 | `page.tsx` / `actions.ts` |
|---|---|---|
| Step 2 | 定数配列 | 初回作成 |
| Step 4 | JSON ファイル | **変更なし** |
| Step 6 | SQLite + Drizzle | **変更なし** |

**保存先を 3回替えたのに、画面側のコードは一度も触っていない。**
`await getPosts()` という呼び出しの形さえ守れば、内側は自由に入れ替えられる。
これがデータ層を分ける目的そのもの。

---

## 6-7. 実測: 何が良くなったか

### ① 同時書き込みでデータが消えなくなった

Step 4 の 4-7 で「JSON は同時書き込みに弱い」と書いた点を、実際に測った。

**5件を同時に投稿したときの結果**

| | 期待 | 結果 |
|---|---|---|
| SQLite（`node:sqlite`） | 3件 → 8件 | **8件** ✅ 5件すべて保存された |
| JSON（Step 4 の `addPost` を直接テスト） | 1件 → 6件 | **2件** ❌ 4件が消えた |

JSON 版が壊れる理由は手順にある。

```
プロセスA: 読む(1件) → 足す(2件) → 丸ごと書く
プロセスB: 読む(1件) → 足す(2件) → 丸ごと書く   ← A の結果を上書きしてしまう
```

**「読む → 変更する → 全体を書き戻す」は、同時に起きると必ず取りこぼす**（ロストアップデート）。
SQLite はトランザクションとロックでこれを防ぐ。1件ずつ確実に積まれる。

### ② 学習用の遅延を削除した

Step 3 で入れた `sleep(400)` / `sleep(1500)` を、約束どおり削除した。

| | Step 5（JSON + 遅延あり） | Step 6（SQLite） |
|---|---|---|
| `/blog`（動的 `ƒ`） | 0.406 秒 | **0.036 秒** |
| `/blog/hello-nextjs`（`●`） | — | 0.004 秒 |
| `npm run build` の静的生成 | 2.2 秒 | **0.21 秒** |

**Step 5 で見た「動的は 0.4 秒かかる」の中身は、ほぼ学習用の遅延だった。**
動的レンダリング自体のコストはずっと小さい。
（ただし「アクセスのたびにサーバーが働く」という構造上の違いは変わらない。）

### ③ 副作用: ストリーミングが目に見えなくなった

データが速くなったので、Step 3 で書いた `loading.tsx` と `<Suspense>` は
**動いてはいるが一瞬すぎて見えない**。
コードとしては正しいままなので、重い処理が入ったときに効く。
確かめたければ `getRelatedPosts` に `await sleep(1500)` を一時的に戻せばよい。

---

## つまずきポイント

| 症状 | 原因 |
|---|---|
| `Cannot find module 'drizzle-orm/node-sqlite'` | `latest`（0.45.x）を入れている。`node:sqlite` 対応は v1 系（`@rc`） |
| `Cannot find module 'node:sqlite'`（型エラー） | `@types/node` が古い。Node 24 に合わせて `^24` に上げる |
| `Your migrations folder format is outdated` | Drizzle のメジャー更新後。`npx drizzle-kit up` で変換する |
| `no such table: posts` | `npm run db:migrate` を実行していない |
| 記事が 0 件 | migrate はしたが `npm run db:seed` をしていない |
| 開発中に `too many connections` 的な挙動 | 接続を `globalThis` に載せていない（6-4） |
| `npm run build` が DB エラーで落ちる | `generateStaticParams` がビルド時に DB を読む。先に `db:setup` が必要 |
| `Cannot find module './schema'`（seed 実行時） | Node で直接実行するときは import に拡張子が必要。`'./schema.ts'` と書く |
| スキーマを変えたのに反映されない | `db:generate` だけで `db:migrate` を忘れている |

---

## この Step のまとめ

- **スキーマ（`src/db/schema.ts`）が唯一の正**。そこから
  **マイグレーション SQL と TypeScript の型の両方**が生成される
- 型は `typeof posts.$inferSelect` で受け取る。**`type Post = {...}` を手書きしない**
- **生成された SQL はコミットする**。DB のバイナリ（`data/blog.db`）はコミットしない
  → `npm run db:setup` でいつでも再現できる
- SQLite のドライバは **Node 組み込みの `node:sqlite`**。外部パッケージもネイティブビルドも要らない
  （ネイティブモジュールを使う場合だけ `serverExternalPackages` が要る）
- 開発中の接続は **`globalThis` に退避**して、Fast Refresh で増やさない
- **絞り込みと並べ替えを DB に任せる**。「全部読んでから捨てる」をやめる
- **同時書き込みでデータが消えなくなった**（実測: 5件同時投稿で JSON は 4件消失、SQLite は 0件）
- そして **保存先を 3回替えても、ページ側のコードは一度も書き換えていない**

---

## ここまでで学んだこと

| Step | 中心概念 |
|---|---|
| 0 | Next.js は React に「サーバー」と「ルーティング」を足したもの |
| 1 | `page.tsx` / `layout.tsx`。フォルダが URL になる |
| 2 | `async` な Server Component。動的ルート `[slug]` |
| 3 | `"use client"` は境界。`loading.tsx` とストリーミング |
| 4 | Server Actions。API を書かずにデータを更新する |
| 5 | Request-time API を読むとページが動的になる |
| 6 | データ層を分けておけば、保存先は後から替えられる |

貫いているのは Step 0 で挙げた一本の軸——**「そのコードはどこで、いつ実行されるのか」**。

- **ビルド時** … `generateStaticParams`、静的レンダリング（`○` `●`）
- **サーバー（リクエストごと）** … Server Component、Server Actions、動的レンダリング（`ƒ`）
- **ブラウザ** … `"use client"` を付けた部分だけ

この 3つを意識して置き場所を決められれば、App Router はもう読める。

### この先

README の「発展トピック」に挙げたもの——Route Handlers、Proxy、認証・認可、
Cache Components（`use cache`）、そしてデプロイ——は、必要になったタイミングで
`node_modules/next/dist/docs/` の公式ドキュメントを引けばよい。
**インストール済みのバージョンそのものの説明が入っている**ので、ネット検索より確実。
