"use client";

import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { supabase } from "../../../../lib/supabase";
import SendButton from "./SendButton";
import useStore from "../../../../store"; // Zustandのストアをインポート

type ChatMessage = {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type Props = {
  request_id: string | null;
  setReloadFlg: Dispatch<SetStateAction<boolean>>;
};

export default function ChatList({ request_id, setReloadFlg }: Props) {
  const { user } = useStore(); // Zustandのストアからユーザー情報を取得
  const [chatData, setChatData] = useState<ChatMessage[]>([]);
  const [reloadFlg, setLocalReloadFlg] = useState<boolean>(false);

  useEffect(() => {
    if (request_id == null || user == null) return;
    getChatData();
    setLocalReloadFlg(false);
  }, [request_id, reloadFlg]);

  const getChatData = async () => {
    const { data, error } = await supabase
      .from("apply_message")
      .select()
      .eq("request_id", request_id);

    if (error) {
      console.log(error);
      return [];
    }

    setChatData(data as ChatMessage[]);

    // チャットリストにユーザーを追加する条件
    const { data: requestData, error: requestError } = await supabase
      .from("request")
      .select("requester_id, textbook_id")
      .eq("id", request_id)
      .eq("status", "consent");

    if (requestError || !requestData || requestData.length === 0) {
      console.log(requestError);
      return;
    }

    const request = requestData[0];
    if (user.id === request.requester_id || user.id === request.textbook_id) {
      // リストにユーザーを追加するロジックをここに追加
    }
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
      <SendButton request_id={request_id} setReloadFlg={setReloadFlg} />
    </div>
  );
}
