"use client";

import { useState, Dispatch, SetStateAction, KeyboardEvent } from "react";
import { supabase } from "../../../../lib/supabase";
import useStore from "../../../../store"; // Zustandのストアをインポート
import { ChatMessage } from "./ChatList"; // ChatMessage をインポート
import { Loader2, Send } from "lucide-react";

type Props = {
  request_id: string | null;
  setChatData: Dispatch<SetStateAction<ChatMessage[]>>;
};

export default function SendButton({ request_id, setChatData }: Props) {
  const { user } = useStore(); // Zustandのストアからユーザー情報を取得
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const onSubmit = async () => {
    if (isLoading || !message.trim()) return;
    setIsLoading(true);

    if (user == null || request_id == null || message.trim() === "") return;

    try {
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
        receiver_id: requestData.requester_id,
        request_id: request_id,
        message: message.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        delete_flg: false,
        is_read: false,
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
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed flex justify-center h-16 bottom-0 left-0 w-full">
      <div className="w-full max-w-4xl bg-white shadow-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={onSubmit}
            disabled={isLoading || !message.trim()}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded-md px-4 py-2 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
