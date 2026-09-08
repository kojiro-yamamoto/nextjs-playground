// ファイルの先頭に書くと、このファイルの export すべてが Server Action になる。
// 「ここから先はサーバーでしか動かない」という宣言。
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addPost, slugExists, type Post } from './posts'

// フォームに返す状態。エラーと、入力し直さなくて済むよう入力値も返す。
export type CreatePostState = {
  errors?: {
    title?: string
    slug?: string
    body?: string
  }
  values?: {
    title: string
    slug: string
    body: string
  }
}

const SLUG_PATTERN = /^[a-z0-9-]+$/

// 静的セグメント（/blog/new）と衝突する slug は使えない
const RESERVED_SLUGS = ['new']

export async function createPost(
  // useActionState から呼ばれるので、第1引数は「前回の状態」になる
  _prevState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  const title = String(formData.get('title') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()

  // --- 検証 ---
  // 「起こりうるエラー」は throw せず、戻り値として返す。
  // throw すると error.tsx が出てしまい、入力内容も失われる。
  const errors: NonNullable<CreatePostState['errors']> = {}

  if (!title) {
    errors.title = 'タイトルを入力してください'
  }

  if (!slug) {
    errors.slug = 'URL 用の slug を入力してください'
  } else if (!SLUG_PATTERN.test(slug)) {
    errors.slug = '半角英小文字・数字・ハイフンだけが使えます'
  } else if (RESERVED_SLUGS.includes(slug)) {
    errors.slug = `"${slug}" は予約語のため使えません`
  } else if (await slugExists(slug)) {
    errors.slug = 'その slug はすでに使われています'
  }

  if (!body) {
    errors.body = '本文を入力してください'
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values: { title, slug, body } }
  }

  // --- 保存 ---
  const post: Post = {
    slug,
    title,
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    excerpt: body.length > 60 ? `${body.slice(0, 60)}…` : body,
    body,
  }
  await addPost(post)

  // 一覧ページのキャッシュを捨てる。これが無いと、
  // ビルド時に作り置きされた古い一覧が出続ける。
  revalidatePath('/blog')

  // redirect は例外を投げて処理を打ち切るので、必ず try/catch の外で呼ぶ
  redirect(`/blog/${slug}`)
}
