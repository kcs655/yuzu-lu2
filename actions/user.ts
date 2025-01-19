// actions/user.ts
"use server";

import { EmailSchema } from "../schemas";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { supabaseServer } from "../lib/supabase-server"; // サーバー用クライアントをインポート

export const updateEmail = async (values: z.infer<typeof EmailSchema>) => {
  try {
    console.log("Sending email verification for:", values.email);
    const { error: updateUserError, data } =
      await supabaseServer.auth.updateUser({
        email: values.email,
      });

    if (updateUserError) {
      console.error("Update user error:", updateUserError);
      return { error: updateUserError.message };
    }

    console.log("Updated user data:", data);
    await revalidateTag("settings"); // "settings" タグを持つページを再検証
    return { message: "メールアドレスの変更リクエストを送信しました。" };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error revalidating tag:", error);
      return { error: error.message };
    }
    console.error("Unknown error");
    return { error: "不明なエラーが発生しました" };
  }
};
