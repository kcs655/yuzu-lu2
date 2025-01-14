"use client";

import { useEffect } from "react";
import { useRouter } from "next/compat/router"; // `next/compat/router` を使用
import { supabase } from "../../../../lib/supabase";
import ChatView from "@/app/components/chats/ChatView";
import useStore from "../../../../store"; // Zustandのストアをインポート

interface SearchParams {
  companyid: string;
}

export default function ChatsPage({
 
}: {
  searchParams: SearchParams;
}) {
  const { setUser } = useStore(); // Zustandのストアからユーザー設定関数を取得
  const router = useRouter();

  useEffect(() => {
    if (!router) return; // routerがnullでないことを確認

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
      } else {
        // Zustandのストアにユーザー情報を設定
        setUser({ id: user.id, email: user.email });
      }
    };

    fetchUser();
  }, [router, setUser]);

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <ChatView />
    </div>
  );
}
