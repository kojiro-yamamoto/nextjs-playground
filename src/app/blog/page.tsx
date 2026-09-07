import styles from './page.module.css'

// Step 1 では、記事はまだ JSX への直書き。
// Step 2 でデータ（配列）に切り出し、map で回すようにする。
export default function BlogPage() {
  return (
    <>
      <ul className={styles.list}>
        <li className={styles.item}>
          <p className={styles.date}>2026-09-07</p>
          <h2 className={styles.title}>Next.js の学習をはじめた</h2>
          <p className={styles.excerpt}>
            React だけでは足りない部分をフレームワークがどう埋めるのか、から確認していく。
          </p>
        </li>

        <li className={styles.item}>
          <p className={styles.date}>2026-09-07</p>
          <h2 className={styles.title}>フォルダがそのまま URL になる</h2>
          <p className={styles.excerpt}>
            App Router のルーティングは、page.tsx を置いた場所が公開される URL になる。
          </p>
        </li>

        <li className={styles.item}>
          <p className={styles.date}>2026-09-07</p>
          <h2 className={styles.title}>layout は入れ子になる</h2>
          <p className={styles.excerpt}>
            ルートの layout の内側に、セグメントごとの layout が積み重なっていく。
          </p>
        </li>
      </ul>

      <p className={styles.todo}>
        Step 1 は骨組みだけ。タイトルはまだリンクになっていません（Step 2 で記事詳細ページを作ります）。
      </p>
    </>
  )
}
