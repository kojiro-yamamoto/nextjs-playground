// 記事のデータ層。
//
// Step 2: 定数配列
// Step 4: JSON ファイル
// Step 6: SQLite + Drizzle（← いま）
//
// 中身は 2回 入れ替わったが、公開している関数の「形」は Step 2 のまま。
// だから page.tsx / actions.ts 側は一度も書き換えていない。

import { desc, eq, like, ne, or } from 'drizzle-orm'
import { db } from '@/db'
import { type NewPost, posts } from '@/db/schema'

// 型はテーブル定義から生成されたものをそのまま使う
export type { NewPost, Post } from '@/db/schema'

/**
 * 記事を新しい順に返す。
 * query を渡すと、タイトル・要約・本文に含まれるものだけに絞り込む。
 */
export async function getPosts(query?: string) {
  const where = query
    ? or(
        like(posts.title, `%${query}%`),
        like(posts.excerpt, `%${query}%`),
        like(posts.body, `%${query}%`),
      )
    : undefined

  // 絞り込みも並べ替えも SQL に任せる。
  // Step 4 までは全件をメモリに読んでから JS で filter していた。
  return db.select().from(posts).where(where).orderBy(desc(posts.date))
}

/** slug に一致する記事を返す。見つからなければ undefined */
export async function getPost(slug: string) {
  const rows = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1)
  return rows.at(0)
}

/** 指定した記事以外を返す（関連記事） */
export async function getRelatedPosts(slug: string) {
  return db
    .select()
    .from(posts)
    .where(ne(posts.slug, slug))
    .orderBy(desc(posts.date))
    .limit(5)
}

/** slug が既に使われているか（重複チェック用） */
export async function slugExists(slug: string) {
  const rows = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1)
  return rows.length > 0
}

/** 記事を1件追加して保存する */
export async function addPost(post: NewPost) {
  await db.insert(posts).values(post)
}
