import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts', // テーブル定義の場所
  out: './drizzle', // 生成される SQL の置き場所
  dbCredentials: { // Drizzle Kit が「どのデータベースに接続するのか」を指定する設定です。
    url: './data/blog.db',
  },
})
