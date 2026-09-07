import styles from './site-footer.module.css'

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>Next.js を Step ごとに学ぶための学習用リポジトリ</p>
      </div>
    </footer>
  )
}
