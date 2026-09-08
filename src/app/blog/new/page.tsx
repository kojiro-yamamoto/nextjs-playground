import type { Metadata } from 'next'
import styles from './page.module.css'
import PostForm from './post-form'

export const metadata: Metadata = {
  title: '新しい記事',
}

// このページ自体は Server Component。
// 対話が必要なフォームだけを Client Component（PostForm）に切り出している。
export default function NewPostPage() {
  return (
    <div>
      <p className={styles.lead}>
        投稿した内容は SQLite（<code>data/blog.db</code>）に保存されます。
      </p>
      <PostForm />
    </div>
  )
}
