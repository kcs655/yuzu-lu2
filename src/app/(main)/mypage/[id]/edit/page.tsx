"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../../../lib/supabase"; // 正しいパスを確認
import TextbookEdit from "@/app/components/mypage/BlogEdit";
import { User } from "@supabase/supabase-js";

interface TextbookType {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  subject?: string;
  grade?: number;
  details?: string;
  imageUrl?: string;
  updated_at: string;
  created_at: string;
}

const TextbookEditPage = () => {
  const router = useRouter();
  const params = useParams(); // useParamsを使ってパラメータを取得
  const textbookId = params?.id; // パラメータ名を正しく取得
  const [user, setUser] = useState<User | null>(null);
  const [textbook, setTextbook] = useState<TextbookType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("params:", params); // デバッグ用のログを追加
    console.log("textbookId:", textbookId); // デバッグ用のログを追加

    const fetchUser = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error(
          "Error fetching user data:",
          userError?.message || "No user found"
        );
        router.push("/mypage");
      } else {
        setUser(userData.user as User);
      }
    };

    const fetchTextbook = async () => {
      if (!textbookId) {
        console.error("Invalid textbookId:", textbookId); // デバッグ用のログを追加
        router.push("/mypage");
        return;
      }

      const { data: textbookData, error: textbookError } = await supabase
        .from("textbook")
        .select("*")
        .eq("id", textbookId)
        .single();

      if (textbookError || !textbookData) {
        console.error(
          "Error fetching textbook data:",
          textbookError?.message || "No textbook data found"
        );
        router.push("/mypage");
      } else {
        setTextbook(textbookData);
      }
    };

    const initialize = async () => {
      setLoading(true);
      await fetchUser();
      await fetchTextbook();
      setLoading(false);
    };

    initialize();
  }, [router, textbookId]);

  useEffect(() => {
    if (user && textbook && user.id !== textbook.user_id) {
      router.push(`/textbook/${textbook.id}`);
    }
  }, [user, textbook, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !textbook) {
    return null;
  }

  return <TextbookEdit textbook={textbook} />;
};

export default TextbookEditPage;
