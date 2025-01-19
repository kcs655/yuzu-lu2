"use client";

import { useState, useTransition, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { EmailSchema } from "../../../../schemas";
import { updateEmail } from "../../../../actions/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../../../lib/supabase";

interface EmailProps {
  email: string;
}

const Email = ({ email }: EmailProps) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error);
      } else {
        setAccessToken(sessionData?.session?.access_token || null);
        setRefreshToken(sessionData?.session?.refresh_token || null);
      }
    };
    getSession();
  }, []);

  const form = useForm<z.infer<typeof EmailSchema>>({
    resolver: zodResolver(EmailSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof EmailSchema>) => {
    setError("");

    if (!accessToken || !refreshToken) {
      setError("認証セッションが見つかりません。ログインしてください。");
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateEmail(
          {
            ...values,
          },
          accessToken,
          refreshToken
        );

        if (res?.error) {
          setError(res.error);
          return;
        }

        toast.success("メールアドレスが更新されました");
        router.push("/mypage");
        router.refresh();
      } catch (error) {
        console.error(error);
        setError("エラーが発生しました");
      }
    });
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <h1
        style={{
          fontWeight: "bold",
          fontSize: "24px",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        メールアドレス変更
      </h1>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}
        >
          現在のメールアドレス
        </label>
        <div>{email}</div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        style={{ display: "grid", gap: "20px" }}
      >
        <div>
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            新しいメールアドレス
          </label>
          <input
            id="email"
            type="email"
            placeholder="example@example.com"
            {...form.register("email")}
            disabled={isPending}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          {form.formState.errors.email && (
            <p style={{ color: "red", marginTop: "5px" }}>
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            fontWeight: "bold",
            color: "#fff",
            backgroundColor: "#0070f3",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isPending && (
            <span className="loader" style={{ marginRight: "8px" }}>
              🔄
            </span>
          )}
          <span>変更</span>
        </button>
      </form>
    </div>
  );
};

export default Email;
