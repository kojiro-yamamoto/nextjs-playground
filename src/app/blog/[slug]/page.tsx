import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost, getPosts } from '@/lib/posts'
import styles from './page.module.css'

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

      <Link href="/blog" className={styles.back}>
        ← 記事一覧へ戻る
      </Link>
    </article>
  )
}
