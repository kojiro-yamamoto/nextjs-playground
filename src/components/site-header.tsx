import Link from 'next/link'
import styles from './site-header.module.css'

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <p className={styles.title}>
          <Link href="/" className={styles.titleLink}>
            Next.js Playground
          </Link>
        </p>
        <nav className={styles.nav}>
          <Link href="/blog">記事一覧</Link>
          <Link href="/about">このサイトについて</Link>
        </nav>
      </div>
    </header>
  )
}
