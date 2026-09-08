// データベースへの接続。アプリ全体でこれ 1つを使い回す。

import { drizzle } from 'drizzle-orm/node-sqlite'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const DB_FILE = path.join(process.cwd(), 'data', 'blog.db')

// 開発中は Fast Refresh のたびにこのファイルが読み直され、
// そのつど接続が増えてしまう。globalThis に載せて使い回す。
const globalForDb = globalThis as unknown as { sqlite?: DatabaseSync }

const sqlite = globalForDb.sqlite ?? new DatabaseSync(DB_FILE)

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqlite = sqlite
}

export const db = drizzle({ client: sqlite })
