"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import ChatList from "./ChatList";
import useStore from "../../../../store"; // Zustandのストアをインポート

export default function ChatView() {
  const { user: currentUser, setUser } = useStore(); // Zustandのストアからユーザー情報を取得
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
        .select("id")
        .eq("user_id", user.id);
      if (textbookError || !textbooks) {
        console.error("Error fetching textbooks:", textbookError?.message);
        return;
      }

      const textbookIds = textbooks.map(
        (textbook: { id: string }) => textbook.id
      );

      // 教科書IDに基づいてリクエストを絞り込み、statusがconsentのものを取得
      const { data: requests, error: requestError } = await supabase
        .from("request")
        .select()
        .eq("status", "consent")
        .in("textbook_id", textbookIds);
      if (requestError || !requests) {
        console.error("Error fetching requests:", requestError?.message);
        return;
      }

      const result = await Promise.all(
        requests.map(async (request: any) => {
          const requesterData = await getRequesterData(request.requester_id);
          if (requesterData.length === 0) return null;

          return {
            id: request.id,
            requester: requesterData[0].email,
          };
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

  return (
    <div className="relative flex w-full max-w-4xl h-max min-h-screen pb-16">
      <ul className="w-64 max-w-64 bg-white">
        {requests.map((item) => (
          <li className="border-b-gray-200 border-b" key={item.id}>
            <button
              onClick={() => {
                setCurrentRequestID(item.id);
              }}
              className="text-left p-4 bg-white w-full hover:bg-gray-200"
            >
              {item.requester}
            </button>
          </li>
        ))}
      </ul>
      <div className="w-full bg-gray-200 border-l p-4">
        <ChatList request_id={currentRequestID} />
      </div>
    </div>
  );
}
