import Link from 'next/link'
import { getRelatedPosts } from '@/lib/posts'
import styles from './related-posts.module.css'

// 本文より重い（1秒かかる）async Server Component。
// これを <Suspense> で包むと、本文を先に見せて、ここだけ後から差し込める。
export default async function RelatedPosts({ slug }: { slug: string }) {
  const related = await getRelatedPosts(slug)

  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>ほかの記事</h3>
      <ul className={styles.list}>
        {related.map((post) => (
          <li key={post.slug} className={styles.item}>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

// <Suspense fallback> に渡す、読み込み中の見た目。
export function RelatedPostsSkeleton() {
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>ほかの記事</h3>
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
    </section>
  )
}
