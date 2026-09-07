import Link from 'next/link'
import type { Post } from '@/lib/posts'
import styles from './post-card.module.css'

// このルートでしか使わないので、app/blog/ の隣に置いている（コロケーション）。
// props で Post を受け取るだけの、React でおなじみのコンポーネント。
export default function PostCard({ post }: { post: Post }) {
  return (
    <li className={styles.item}>
      <p className={styles.date}>{post.date}</p>
      <h2 className={styles.title}>
        <Link href={`/blog/${post.slug}`} className={styles.titleLink}>
          {post.title}
        </Link>
      </h2>
      <p className={styles.excerpt}>{post.excerpt}</p>
    </li>
  )
}
