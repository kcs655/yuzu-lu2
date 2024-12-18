"use server"
import { supabase } from "../lib/supabase"






interface deleteBookProps {
  bookId: string
  imageUrl: string | null
  userId: string
}

// ブログ削除
export const deleteBook = async ({
  bookId,
  imageUrl,
  userId,
}: deleteBookProps) => {
  try {

    // ブログ削除
    const { error } = await supabase.from("textbook").delete().eq("id", bookId)

    if (error) {
      return { error: error.message }
    }

    if (!imageUrl) {
      return
    }

    // ファイル名取得
    const fileName = imageUrl.split("/").slice(-1)[0]

    // 画像を削除
    await supabase.storage.from("textbook").remove([`${userId}/${fileName}`])
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました" }
  }
}