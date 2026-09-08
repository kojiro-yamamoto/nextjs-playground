'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import styles from './search-form.module.css'

// 検索語を useState で持たない。URL（?q=...）そのものが状態。
export default function SearchForm() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // startTransition で包むと、切り替え中も今の画面を出したままにできる
  const [isPending, startTransition] = useTransition()

  const query = searchParams.get('q') ?? ''

  // 1文字打つたびにサーバーへ行かないよう、入力が止まってから送る
  const [text, setText] = useState(query)

  // 「検索を解除」など、入力欄の外から URL の ?q が変わったら入力も合わせる。
  // これが無いと text に検索語が残り、下の useEffect が ?q を付け直してしまう。
  const [lastQuery, setLastQuery] = useState(query)
  if (query !== lastQuery) {
    setLastQuery(query)
    setText(query)
  }

  useEffect(() => {
    // 打ち始めの1回目は URL と同じなので何もしない
    if (text === query) {
      return
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (text) {
        params.set('q', text)
      } else {
        params.delete('q')
      }
      // push ではなく replace。検索の1文字ごとに履歴が増えると「戻る」が使えなくなる
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 300)

    // 次の入力が来たら、まだ発火していないタイマーを取り消す（これがデバウンス）
    return () => clearTimeout(timer)
  }, [text, query, searchParams, pathname, router])

  return (
    // JS が無い環境では、これがただの GET フォームとして機能する
    <form className={styles.form} action={pathname} method="GET">
      <input
        className={styles.input}
        type="search"
        name="q"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="記事を検索"
        aria-label="記事を検索"
      />
      {isPending && <span className={styles.pending}>検索中…</span>}
    </form>
  )
}
