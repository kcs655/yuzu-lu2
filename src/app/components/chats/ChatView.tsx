"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import ChatList from "./ChatList";
import useStore from "../../../../store"; 

export default function ChatView() {
  const { setUser } = useStore(); // Zustandのストアからユーザー情報を取得
  const [requests, setRequests] = useState<any[]>([]);
  const [currentRequestID, setCurrentRequestID] = useState<string | null>(null);

  // サイドバーの開閉状態
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        .select("id, title")
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
            const { data: textbookData, error: textbookErr } = await supabase
              .from("textbook")
              .select("user_id, title")
              .eq("id", request.textbook_id)
              .single();
            if (textbookErr) {
              console.error(
                "Error fetching textbook data:",
                textbookErr.message
              );
              return null;
            }

            // `user_id` の外部キーである `profiles` テーブルの `email` を取得
            const { data: profileData, error: profileErr } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", textbookData.user_id);

            if (profileErr || profileData.length === 0) {
              console.error(
                "Error fetching profile data:",
                profileErr ? profileErr.message : "No profile found"
              );
              return null;
            }

            const profile = profileData[0];

            return {
              id: request.id,
              requester: profile.email,
              textbookName: textbookData.title,
            };
          } else {
            // `textbook_id` に基づいて教科書のタイトルを取得
            const { data: textbookData, error: textbookErr } = await supabase
              .from("textbook")
              .select("title")
              .eq("id", request.textbook_id)
              .single();
            if (textbookErr || !textbookData) {
              console.error(
                "Error fetching textbook data:",
                textbookErr ? textbookErr.message : "No textbook found"
              );
              return null;
            }

            const requesterData = await getRequesterData(request.requester_id);
            if (requesterData.length === 0) return null;

            return {
              id: request.id,
              requester: requesterData[0].email,
              textbookName: textbookData.title,
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

  // 選択中のチャット情報を取得
  const currentRequest = requests.find((req) => req.id === currentRequestID);

  return (
    <div className="w-full max-w-4xl mx-auto h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white shadow flex items-center px-4 py-2">
        {/* チャット一覧の開閉ボタン */}
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {isSidebarOpen ? "＜" : "＞"}
        </button>

        {/* 選択中のチャットの「メールアドレス - 教科書名」を表示 */}
        <div className="flex-1 text-center font-bold">
          {currentRequestID
            ? `${currentRequest?.requester} - ${currentRequest?.textbookName}`
            : "メールアドレスと教科書名"}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー部分 */}
        {isSidebarOpen && (
          <ul className="w-64 bg-white border-r border-gray-300 overflow-y-auto">
            {requests.map((item) => (
              <li
                key={item.id}
                className={`border-b border-b-gray-200 ${
                  currentRequestID === item.id
                    ? "bg-gray-200 font-bold"
                    : "bg-white"
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
        )}

        {/* チャット表示部分 */}
        <div className="flex-1 bg-gray-200 p-4 overflow-y-auto">
          {currentRequestID ? (
            <>
              <ChatList request_id={currentRequestID} />
            </>
          ) : (
            <p className="text-gray-500">チャットを選択してください</p>
          )}
        </div>
      </div>
    </div>
  );
}
