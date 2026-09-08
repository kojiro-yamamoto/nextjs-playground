'use client'

import { useActionState } from 'react'
import { createPost, type CreatePostState } from '@/lib/actions'
import styles from './post-form.module.css'

const initialState: CreatePostState = {}

export default function PostForm() {
  // useActionState(アクション, 初期状態)
  //   state      … アクションが return した値（＝検証エラーと入力値）
  //   formAction … <form action> に渡すためのラッパー
  //   isPending  … 送信中かどうか
  const [state, formAction, isPending] = useActionState(createPost, initialState)

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          タイトル
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className={`${styles.input} ${state.errors?.title ? styles.invalid : ''}`}
          // 検証に失敗しても入力が消えないよう、返ってきた値を初期値に使う
          defaultValue={state.values?.title}
          aria-invalid={state.errors?.title ? true : undefined}
        />
        {state.errors?.title && <p className={styles.error}>{state.errors.title}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="slug">
          slug <span className={styles.hint}>URL になる部分。例: my-first-post</span>
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          className={`${styles.input} ${state.errors?.slug ? styles.invalid : ''}`}
          defaultValue={state.values?.slug}
          aria-invalid={state.errors?.slug ? true : undefined}
        />
        {state.errors?.slug && <p className={styles.error}>{state.errors.slug}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="body">
          本文 <span className={styles.hint}>空行で段落が分かれます</span>
        </label>
        <textarea
          id="body"
          name="body"
          className={`${styles.textarea} ${state.errors?.body ? styles.invalid : ''}`}
          defaultValue={state.values?.body}
          aria-invalid={state.errors?.body ? true : undefined}
        />
        {state.errors?.body && <p className={styles.error}>{state.errors.body}</p>}
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={isPending}>
          {isPending ? '投稿中…' : '投稿する'}
        </button>
      </div>
    </form>
  )
}
