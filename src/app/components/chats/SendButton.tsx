"use client";
import { Dispatch, SetStateAction, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import useStore from "../../../../store"; // Zustandのストアをインポート

type Props = {
  request_id: string | null;
  setReloadFlg: Dispatch<SetStateAction<boolean>>;
};

export default function SendButton({ request_id, setReloadFlg }: Props) {
  const { user } = useStore(); // Zustandのストアからユーザー情報を取得
  const [message, setMessage] = useState("");

  const onSubmit = async () => {
    if (user == null || request_id == null || message.trim() === "") return;

    const { error } = await supabase.from("apply_message").insert({
      sender_id: user.id,
      request_id: request_id,
      message: message,
      updated_at: new Date(),
      created_at: new Date(),
    });

    if (error) {
      console.log(error);
      return;
    }

    // リクエストにメッセージ送信者を追加
    const { error: requestError } = await supabase
      .from("request")
      .update({ last_message_sender: user.id })
      .eq("id", request_id);

    if (requestError) {
      console.log(requestError);
      return;
    }

    setReloadFlg(true);
    setMessage("");
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
