// テーブル定義。ここが「唯一の正」になる。
// このファイルから、マイグレーション用の SQL も TypeScript の型も生成される。

import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  // slug をそのまま主キーにしている。URL と 1対1 で対応するため。
  // （実務では数値の id を別に持つことが多い）
  slug: text('slug').primaryKey(),
  title: text('title').notNull(),
  date: text('date').notNull(), // SQLite に日付型は無いので TEXT で 'YYYY-MM-DD'
  excerpt: text('excerpt').notNull(),
  body: text('body').notNull(),
})

// ★ 型を手で書かない。テーブル定義から生成する。
//    カラムを足せば、この型も自動で追従する。
export type Post = typeof posts.$inferSelect // SELECT で返ってくる行の型(データを取得するための型)
export type NewPost = typeof posts.$inferInsert // INSERT に渡す値の型(データを挿入するための型)
