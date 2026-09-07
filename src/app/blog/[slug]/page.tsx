import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getPost, getPosts } from '@/lib/posts'
import styles from './page.module.css'
import RelatedPosts, { RelatedPostsSkeleton } from './related-posts'
import ShareButton from './share-button'

// どの slug のページを作れるかを Next.js に教える。
// これがあるとビルド時に全記事の HTML が作り置きされる（静的レンダリング）。
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

// <title> や description を、記事ごとに変える。
// 静的な metadata と違い、params を見て動的に組み立てられる。
export async function generateMetadata({
  params,
}: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return { title: '記事が見つかりません' }
  }

  return {
    title: post.title,
    description: post.excerpt,
  }
}

export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
  // params は Promise。await を忘れるとエラーになる（Next.js 15 以降）
  const { slug } = await params
  const post = await getPost(slug)

  // 存在しない slug なら 404 へ。この行以降は実行されない
  if (!post) {
    notFound()
  }

  return (
    <article className={styles.article}>
      <p className={styles.date}>{post.date}</p>
      <h2 className={styles.title}>{post.title}</h2>

      <div className={styles.body}>
        {post.body.split('\n\n').map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className={styles.actions}>
        {/* Server Component の中に Client Component を置く。これが基本形 */}
        <ShareButton />
        <Link href="/blog" className={styles.back}>
          ← 記事一覧へ戻る
        </Link>
      </div>

      {/*
        RelatedPosts は 1秒かかる。Suspense で包むと、
        ここより上（本文）を待たせずに先に送り、
        準備できた時点でこの部分だけを差し込める（ストリーミング）。
      */}
      <Suspense fallback={<RelatedPostsSkeleton />}>
        <RelatedPosts slug={post.slug} />
      </Suspense>
    </article>
  )
}
