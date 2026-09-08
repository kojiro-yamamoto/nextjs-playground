// 記事のデータ層。
//
// Step 2: 定数配列
// Step 4: JSON ファイル（← いま）
// Step 6: SQLite
//
// 中身は差し替わっているが、公開している関数の「形」は Step 2 のまま。
// だからページ側のコードは一度も書き換えていない。

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type Post = {
  slug: string // URL に使う識別子。/blog/<slug> になる
  title: string
  date: string // YYYY-MM-DD
  excerpt: string // 一覧に出す要約
  body: string // 本文
}

// process.cwd() はプロジェクトのルート。@/ のようなエイリアスは
// TypeScript の import 用なので、ファイルパスには使えない。
const DATA_FILE = path.join(process.cwd(), 'data', 'posts.json')

// --- 学習用の遅延 -----------------------------------------------------------
// ファイル読み込みは実際には一瞬で終わるので、loading.tsx やストリーミングが
// 観察できるよう待ち時間を足している。Step 6 で削除する。
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
// ---------------------------------------------------------------------------

async function readPosts(): Promise<Post[]> {
  const json = await readFile(DATA_FILE, 'utf-8')
  return JSON.parse(json) as Post[]
}

async function writePosts(posts: Post[]): Promise<void> {
  await writeFile(DATA_FILE, `${JSON.stringify(posts, null, 2)}\n`, 'utf-8')
}

/**
 * 記事を新しい順に返す。
 * query を渡すと、タイトル・要約・本文に含まれるものだけに絞り込む。
 */
export async function getPosts(query?: string): Promise<Post[]> {
  await sleep(400)
  const posts = await readPosts()
  const sorted = posts.sort((a, b) => b.date.localeCompare(a.date))

  if (!query) {
    return sorted
  }

  // 本来は DB の全文検索に任せる部分。Step 6 で SQLite に移す
  const needle = query.toLowerCase()
  return sorted.filter((post) =>
    [post.title, post.excerpt, post.body].some((text) =>
      text.toLowerCase().includes(needle),
    ),
  )
}

/** slug に一致する記事を返す。見つからなければ undefined */
export async function getPost(slug: string): Promise<Post | undefined> {
  await sleep(400)
  const posts = await readPosts()
  return posts.find((post) => post.slug === slug)
}

/**
 * 指定した記事以外を返す（関連記事）。
 * 本文より重い処理の例として、あえて他より遅くしている。
 */
export async function getRelatedPosts(slug: string): Promise<Post[]> {
  await sleep(1500)
  const posts = await readPosts()
  return posts.filter((post) => post.slug !== slug)
}

/** slug が既に使われているか（重複チェック用。遅延なし） */
export async function slugExists(slug: string): Promise<boolean> {
  const posts = await readPosts()
  return posts.some((post) => post.slug === slug)
}

/** 記事を1件追加して保存する */
export async function addPost(post: Post): Promise<void> {
  const posts = await readPosts()
  posts.push(post)
  await writePosts(posts)
}
