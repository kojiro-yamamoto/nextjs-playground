import Link from 'next/link'
import styles from './not-found.module.css'

// notFound() が呼ばれたとき、この画面が代わりに描かれる。
// 置いた場所（app/blog/[slug]/）の layout の内側に収まるので、
// ヘッダーや「ブログ」の帯はそのまま残る。
export default function PostNotFound() {
  return (
    <div className={styles.wrapper}>
      <h2>記事が見つかりません</h2>
      <p className={styles.lead}>
        URL が間違っているか、記事が削除された可能性があります。
      </p>
      <Link href="/blog">← 記事一覧へ戻る</Link>
    </div>
  )
}
