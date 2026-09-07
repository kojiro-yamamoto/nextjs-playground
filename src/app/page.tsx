import Link from 'next/link'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <main className={styles.main}>
      <h1>Next.js Playground</h1>
      <p className={styles.lead}>
        Next.js（App Router）を Step ごとに学ぶために、ブログアプリを少しずつ育てていく場所です。
      </p>
      <Link href="/blog" className={styles.cta}>
        記事一覧を見る
      </Link>
    </main>
  )
}
