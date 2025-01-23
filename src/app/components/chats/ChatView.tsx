"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import ChatList from "./ChatList";
import useStore from "../../../../store"; // Zustandのストアをインポート

export default function ChatView() {
  const { setUser } = useStore(); // Zustandのストアからユーザー情報を取得
  const [requests, setRequests] = useState<any[]>([]);
  const [currentRequestID, setCurrentRequestID] = useState<string | null>(null);

  useEffect(() => {
    getRequests();
  }, []);

  const getRequests = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (user) {
      setUser({ id: user.id, email: user.email });

      // 現在ログインしているユーザーが登録した本のIDを取得
      const { data: textbooks, error: textbookError } = await supabase
        .from("textbook")
        .select("id, title") // 教科書のタイトルも取得
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
              .select("user_id, title") // 教科書のタイトルも取得
              .eq("id", request.textbook_id)
              .single();
            if (textbookError) {
              console.error(
                "Error fetching textbook data:",
                textbookError.message
              );
              return null;
            }

            // `user_id` の外部キーである `profiles` の `email` を取得
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", textbookData.user_id);

            if (profileError || profileData.length === 0) {
              console.error("Error fetching profile data:", profileError ? profileError.message : "No profile found");
              return null;
            }

            if (profileData.length > 1) {
              console.error("Error: Multiple profiles found for the same ID");
              return null;
            }

            const profile = profileData[0]; // 期待通りに単一のプロファイルを取得

            return {
              id: request.id,
              requester: profile.email,
              textbookName: textbookData.title // 教科書のタイトルを追加
            };
          } else {
            // `textbook_id` に基づいて教科書のタイトルを取得
            const { data: textbookData, error: textbookError } = await supabase
              .from("textbook")
              .select("title") // 教科書のタイトルを取得
              .eq("id", request.textbook_id)
              .single();
            if (textbookError || !textbookData) {
              console.error(
                "Error fetching textbook data:",
                textbookError ? textbookError.message : "No textbook found"
              );
              return null;
            }

            const requesterData = await getRequesterData(request.requester_id);
            if (requesterData.length === 0) return null;

            return {
              id: request.id,
              requester: requesterData[0].email,
              textbookName: textbookData.title // 教科書の名前を追加
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
  };

  return ( 
    <div className="relative flex w-full max-w-4xl h-max min-h-screen pb-16">
      <ul className="w-64 max-w-64 bg-white">
        {requests.map((item) => (
          <li
            key={item.id}
            className={`border-b border-b-gray-200 ${
              currentRequestID === item.id ? "bg-gray-200 font-bold" : "bg-white"
            } transition-all duration-200`}
          >
            <button
              onClick={() => handleRequestClick(item.id)}
              className="text-left p-4 w-full hover:bg-gray-200"
            >
              {item.requester} - {item.textbookName}
            </button>
          </li>
        ))}
      </ul>
      <div className="w-full bg-gray-200 border-l p-4">
        {currentRequestID ? (
          <>
            <h2 className="text-xl font-bold mb-4">
              {requests.find((req) => req.id === currentRequestID)?.textbookName}
            </h2>
            <ChatList request_id={currentRequestID} />
          </>
        ) : (
          <p className="text-gray-500">チャットを選択してください</p>
        )}
      </div>
    </div>
  );
  
}
