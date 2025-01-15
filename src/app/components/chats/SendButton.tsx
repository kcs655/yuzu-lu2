"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { supabase } from "../../../../lib/supabase";
import useStore from "../../../../store"; // Zustandのストアをインポート
import { ChatMessage } from "./ChatList"; // ChatMessage をインポート

type Props = {
  request_id: string | null;
  setChatData: Dispatch<SetStateAction<ChatMessage[]>>;
};

export default function SendButton({ request_id, setChatData }: Props) {
  const { user } = useStore(); // Zustandのストアからユーザー情報を取得
  const [message, setMessage] = useState("");

  const onSubmit = async () => {
    if (user == null || request_id == null || message.trim() === "") return;

    // request_id を用いて request テーブルから requester_id (receiver_id) を取得
    const { data: requestData, error: requestError } = await supabase
      .from("request")
      .select("requester_id")
      .eq("id", request_id)
      .single();

    if (requestError) {
      console.error("Error fetching request data:", requestError);
      return;
    }

    const messageData = {
      sender_id: user.id,
      receiver_id: requestData.requester_id, // receiver_id を設定
      request_id: request_id,
      message: message,
      created_at: new Date().toISOString(), // 日付を ISO 形式にする
      updated_at: new Date().toISOString(), // 日付を ISO 形式にする
      delete_flg: false, // フラグをデフォルト値として設定
    };

    const { data, error } = await supabase
      .from("apply_message")
      .insert(messageData)
      .select();

    if (error) {
      console.error("Error inserting message:", error);
      return;
    }

    setMessage("");
    setChatData((prev) => {
      // 同じIDのメッセージがすでに存在する場合は無視する
      if (prev.find((msg) => msg.id === data[0].id)) {
        return prev;
      }
      return [...prev, data[0]];
    });
  };

  return (
    <div className="fixed flex justify-center h-16 bottom-0 left-0 w-full">
      <div className="w-full max-w-4xl bg-gray-300">
        <div className="relative flex justify-end items-center w-full h-full p-2">
          <input
            name="message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            className="h-full w-4/5 rounded-md"
          />
          <button
            type="button"
            onClick={onSubmit}
            className="ml-2 bg-green-500 hover:bg-green-600 rounded-md px-4 py-2 text-white mb-2"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
