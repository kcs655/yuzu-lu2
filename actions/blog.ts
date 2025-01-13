"use server";

import { supabase } from "../lib/supabase";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

interface EditTextbookProps {
  id: string;
  title: string;
  author?: string;
  subject?: string;
  grade?: number;
  details?: string;
  imageUrl?: string;
  userId: string;
}

// 教科書データのバリデーションスキーマ
const TextbookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string().optional(),
  subject: z.string().optional(),
  grade: z.number().optional(),
  details: z.string().optional(),
  imageUrl: z.string().optional(),
  userId: z.string(),
});

// 教科書編集
export const editTextbook = async (values: EditTextbookProps) => {
  console.log("editTextbook関数が呼ばれました。");
  // 値の検証
  const parseResult = TextbookSchema.safeParse(values);

  if (!parseResult.success) {
    console.log("検証失敗:", parseResult.error);
    return { error: "無効なデータです" };
  }

  try {
    console.log("ユーザーID:", values.userId);
    console.log("教科書ID:", values.id);
    let image_url = values.imageUrl;

    if (image_url) {
      const oldFileName = image_url.split("/").slice(-1)[0];
      console.log("古い画像ファイル名:", oldFileName);
      const { error: removeError } = await supabase.storage
        .from("textbook")
        .remove([`${values.userId}/${oldFileName}`]);
      if (removeError) {
        console.log("画像削除エラー:", removeError.message);
        return { error: removeError.message };
      }
      console.log("古い画像の削除が成功しました。");
    }

    const { error } = await supabase
      .from("textbook")
      .update({
        title: values.title,
        author: values.author,
        subject: values.subject,
        grade: values.grade,
        details: values.details,
        image_url,
      })
      .eq("id", values.id);

    if (error) {
      console.log("Databaseエラー:", error.message);
      return { error: error.message };
    }

    console.log("教科書の更新が成功しました。");
    return { success: true };
  } catch (err) {
    console.error("例外エラー:", err);
    return { error: "エラーが発生しました" };
  }
};

interface deleteBookProps {
  bookId: string;
  imageUrl: string | null;
  userId: string;
}

// 教科書削除
export const deleteBook = async ({
  bookId,
  imageUrl,
  userId,
}: deleteBookProps) => {
  try {
    // 教科書削除
    const { error } = await supabase.from("textbook").delete().eq("id", bookId);

    if (error) {
      return { error: error.message };
    }

    if (!imageUrl) {
      return;
    }

    // ファイル名取得
    const fileName = imageUrl.split("/").slice(-1)[0];

    // 画像を削除
    await supabase.storage.from("textbook").remove([`${userId}/${fileName}`]);
  } catch (err) {
    console.error(err);
    return { error: "エラーが発生しました" };
  }
};
