"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { EmailSchema } from "../../../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateEmail } from "../../../../actions/user";

interface EmailFormProps {
  email: string;
}

const EmailForm = ({ email }: EmailFormProps) => {
  // Emailコンポーネントの名前をEmailFormに変更
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof EmailSchema>>({
    resolver: zodResolver(EmailSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof EmailSchema>) => {
    setError("");

    startTransition(async () => {
      try {
        const result = await updateEmail(values); // サーバーアクションを呼び出す

        if (result?.error) {
          setError(result.error);
        } else {
          toast.success(
            result?.message || "メールアドレスの変更リクエストを送信しました。"
          );
          router.push("/settings");
          router.refresh(); // ページをリフレッシュ
        }
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

export default EmailForm; // Emailコンポーネントの名前をEmailFormに変更
