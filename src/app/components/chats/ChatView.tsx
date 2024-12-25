"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import ChatList from "./ChatList";
import useStore from "../../../../store"; // Zustandのストアをインポート

export default function ChatView() {
  const { user: currentUser, setUser } = useStore(); // Zustandのストアからユーザー情報を取得
  const [requests, setRequests] = useState<any[]>([]);
  const [currentRequestID, setCurrentRequestID] = useState<string | null>(null);
  const [reloadFlg, setReloadFlg] = useState<boolean>(false); // setReloadFlg を追加

  useEffect(() => {
    getRequests();
  }, [reloadFlg]);

  const getRequests = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (user) {
      setUser({ id: user.id, email: user.email });

      // 現在ログインしているユーザーが登録した本のIDを取得
      const { data: textbooks, error: textbookError } = await supabase
        .from("textbook")
        .select("id")
        .eq("user_id", user.id);
      if (textbookError || !textbooks) {
        console.error("Error fetching textbooks:", textbookError?.message);
        return;
      }

      const textbookIds = textbooks.map(
        (textbook: { id: string }) => textbook.id
      );

      // 現在ログインしているユーザーが requester_id と一致するリクエストを取得
      const { data: requestsByRequester, error: requestByRequesterError } =
        await supabase
          .from("request")
          .select()
          .eq("status", "consent")
          .eq("requester_id", user.id);

      if (requestByRequesterError) {
        console.error(
          "Error fetching requests by requester:",
          requestByRequesterError?.message
        );
      }

      // 教科書IDに基づいてリクエストを絞り込み、statusがconsentのものを取得
      const { data: requestsByTextbook, error: requestByTextbookError } =
        await supabase
          .from("request")
          .select()
          .eq("status", "consent")
          .in("textbook_id", textbookIds);

      if (requestByTextbookError) {
        console.error(
          "Error fetching requests by textbook:",
          requestByTextbookError?.message
        );
      }

      const allRequests = [
        ...(requestsByRequester || []),
        ...(requestsByTextbook || []),
      ];

      const result = await Promise.all(
        allRequests.map(async (request: any) => {
          // `requester_id` が現在のユーザーと一致する場合
          if (request.requester_id === user.id) {
            // `textbook_id` の外部キーである `textbook` テーブルの `user_id` を取得
            const { data: textbookData, error: textbookError } = await supabase
              .from("textbook")
              .select("user_id")
              .eq("id", request.textbook_id)
              .single();
            if (textbookError) {
              console.error(
                "Error fetching textbook data:",
                textbookError.message
              );
              return null;
            }

            // `user_id` と一致する `profiles` の `email` を取得
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", textbookData.user_id)
              .single();
            if (profileError) {
              console.error(
                "Error fetching profile data:",
                profileError.message
              );
              return null;
            }

            return {
              id: request.id,
              requester: profileData.email,
            };
          } else {
            const requesterData = await getRequesterData(request.requester_id);
            if (requesterData.length === 0) return null;

            return {
              id: request.id,
              requester: requesterData[0].email,
            };
          }
        })
      );

      setRequests(result.filter((item) => item !== null));
    }
  };

  const getRequesterData = async (id: string) => {
    console.log(`Fetching requester data for ID: ${id}`);

    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", id);

    if (error) {
      console.error("Error fetching requester data:", error.message);
      return [];
    }

    if (data.length === 0) {
      console.warn(`No data found for requester ID: ${id}`);
      return [];
    }

    return data;
  };

  const handleRequestClick = (id: string) => {
    setCurrentRequestID(id);
    setReloadFlg((prev) => !prev); // メッセージ送信後にリロードフラグをトグルして再取得
  };

  return (
    <div className="relative flex w-full max-w-4xl h-max min-h-screen pb-16">
      <ul className="w-64 max-w-64 bg-white">
        {requests.map((item) => (
          <li className="border-b-gray-200 border-b" key={item.id}>
            <button
              onClick={() => handleRequestClick(item.id)}
              className="text-left p-4 bg-white w-full hover:bg-gray-200"
            >
              {item.requester}
            </button>
          </li>
        ))}
      </ul>
      <div className="w-full bg-gray-200 border-l p-4">
        <ChatList
          request_id={currentRequestID}
          setReloadFlg={setReloadFlg} // setReloadFlg を渡す
        />
      </div>
    </div>
  );
}
