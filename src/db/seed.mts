// data/posts.jsonを SQLite へ流し込む。
//   npm run db:seed
//
// Node 24 は TypeScript をそのまま実行できるので、ts-node などは不要。
// アプリ側と違い使い捨てなので、接続はこのスクリプト内で開いて閉じる。

import { drizzle } from 'drizzle-orm/node-sqlite'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { type NewPost, posts } from './schema.ts'

const sqlite = new DatabaseSync(path.join(process.cwd(), 'data', 'blog.db'))
const db = drizzle({ client: sqlite })

const seed: NewPost[] = JSON.parse(
  await readFile(path.join(process.cwd(), 'data', 'posts.json'), 'utf-8'),
)

// 何度実行しても同じ結果になるようにしておく（冪等）
await db.delete(posts)
await db.insert(posts).values(seed)

sqlite.close()
console.log(`${seed.length} 件の記事を data/blog.db に投入しました`)
