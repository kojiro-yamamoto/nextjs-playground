import styles from './loading.module.css'

// /blog 配下のページがサーバーでレンダリングされている間、
// 自動でこれが表示される（page.tsx が <Suspense> で包まれる）。
// layout.tsx は待たされないので、ヘッダーと「ブログ」の帯は先に出る。
export default function BlogLoading() {
  return (
    <div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={styles.skeleton}>
          <div className={`${styles.line} ${styles.date}`} />
          <div className={`${styles.line} ${styles.title}`} />
          <div className={`${styles.line} ${styles.excerpt}`} />
        </div>
      ))}
    </div>
  )
}
