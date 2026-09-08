import Link from 'next/link'
import { getPosts } from '@/lib/posts'
import styles from './page.module.css'
import PostCard from './post-card'
import SearchForm from './search-form'

export default async function BlogPage({ searchParams }: PageProps<'/blog'>) {
  // searchParams も params と同じく Promise。await が必要。
  // ★ これを読んだ時点で、このページは動的レンダリングになる
  const { q } = await searchParams
  const query = typeof q === 'string' ? q : ''

  const posts = await getPosts(query)

  return (
    <>
      <div className={styles.toolbar}>
        <SearchForm />
        <Link href="/blog/new" className={styles.newLink}>
          + 新しい記事
        </Link>
      </div>

      <p className={styles.count}>
        {query ? (
          <>
            「{query}」の検索結果: {posts.length} 件{' '}
            <Link href="/blog" className={styles.clear}>
              検索を解除
            </Link>
          </>
        ) : (
          <>{posts.length} 件</>
        )}
      </p>

      {posts.length === 0 ? (
        <p className={styles.empty}>
          {query ? '一致する記事がありません。' : 'まだ記事がありません。'}
        </p>
      ) : (
        <ul className={styles.list}>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </ul>
      )}
    </>
  )
}
