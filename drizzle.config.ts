import { defineConfig } from 'drizzle-kit'

// drizzle-kit（マイグレーション生成・適用・Studio）の設定。
// アプリの実行時には読まれない。npm run db:* のときだけ使われる。
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts', // テーブル定義の場所
  out: './drizzle', // 生成される SQL の置き場所
  dbCredentials: {
    url: './data/blog.db', // 適用先のデータベース
  },
})
