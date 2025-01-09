import { EmailSchema } from "../schemas";
import { supabase } from "../lib/supabase";
import { z } from "zod";

export const updateEmail = async (
  values: z.infer<typeof EmailSchema>,
  accessToken?: string,
  refreshToken?: string
) => {
  try {
    console.log("Sending email verification for:", values.email);
    const { error: updateUserError } = await supabase.auth.updateUser(
      { email: values.email },
      { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/email/verify` }
    );

    if (updateUserError) {
      console.error("Update user error:", updateUserError);
      return { error: updateUserError.message };
    }

    console.log("Verification email sent successfully");
    return { message: "Verification email sent successfully" };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Catch error:", error.message);
      return { error: error.message };
    }
    console.error("Unknown error");
    return { error: "不明なエラーが発生しました" };
  }
};
