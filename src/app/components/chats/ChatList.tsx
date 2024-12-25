"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import SendButton from "./SendButton";
import useStore from "../../../../store"; // Zustandのストアをインポート

export type ChatMessage = {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type Props = {
  request_id: string | null;
};

export default function ChatList({ request_id }: Props) {
  const { user } = useStore(); // Zustandのストアからユーザー情報を取得
  const [chatData, setChatData] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (request_id == null || user == null) return;
    getChatData();
  }, [request_id]);

  const getChatData = async () => {
    const { data, error } = await supabase
      .from("apply_message")
      .select()
      .eq("request_id", request_id);

    if (error) {
      console.log(error);
      return;
    }

    setChatData(data as ChatMessage[]);
  };

  return (
    <div>
      <ul>
        {chatData.map((item) => (
          <li
            className={
              user?.id === item.sender_id
                ? "flex justify-end mb-2"
                : "flex mb-2"
            }
            key={item.id}
          >
            <div
              className={
                user?.id === item.sender_id
                  ? "inline-block rounded-md p-2 bg-green-500 text-white"
                  : "inline-block rounded-md p-2 bg-white"
              }
            >
              {item.message}
            </div>
          </li>
        ))}
      </ul>
      <SendButton request_id={request_id} setChatData={setChatData} />
    </div>
  );
}
