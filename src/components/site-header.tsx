import Link from 'next/link'
import NavLinks from './nav-links'
import styles from './site-header.module.css'

// このファイルには "use client" が無いので Server Component のまま。
// 対話が必要な部分（現在地の判定）だけを NavLinks に閉じ込めている。
export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <p className={styles.title}>
          <Link href="/" className={styles.titleLink}>
            Next.js Playground
          </Link>
        </p>
        <NavLinks />
      </div>
    </header>
  )
}
