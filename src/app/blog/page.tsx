import Link from 'next/link'
import { getPosts } from '@/lib/posts'
import styles from './page.module.css'
import PostCard from './post-card'

// async な Server Component。サーバーで1回実行され、結果の HTML だけが届く。
// useEffect も useState も、ローディング用の state も要らない。
export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.count}>{posts.length} 件</p>
        <Link href="/blog/new" className={styles.newLink}>
          + 新しい記事
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className={styles.empty}>まだ記事がありません。</p>
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
