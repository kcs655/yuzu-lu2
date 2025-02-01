"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { supabase } from "../../../../lib/supabase";
import SendButton from "./SendButton";
import useStore from "../../../../store";

export type ChatMessage = {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

type Props = {
  request_id: string | null;
};

export default function ChatList({ request_id }: Props) {
  const { user } = useStore();
  const [chatData, setChatData] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollToBottom = () => {
    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (request_id == null || user == null) return;
    getChatData();

    const chatChannel = supabase
      .channel("chat-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "apply_message",
          filter: `request_id=eq.${request_id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setChatData((prevData) => {
            if (prevData.find((message) => message.id === newMessage.id)) {
              return prevData;
            }
            return [...prevData, newMessage];
          });
        }
      )
      .subscribe();

    const readChannel = supabase
      .channel("read-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "apply_message",
          filter: `request_id=eq.${request_id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setChatData((prevData) =>
            prevData.map((message) =>
              message.id === updatedMessage.id ? updatedMessage : message
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(readChannel);
    };
  }, [request_id]);

  useEffect(() => {
    scrollToBottom();
  }, [chatData]);

  const getChatData = async () => {
    const { data, error } = await supabase
      .from("apply_message")
      .select()
      .eq("request_id", request_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }

    setChatData(data as ChatMessage[]);
  };

  const markAsRead = async (messageIds: string[]) => {
    if (!messageIds.length) return;

    const { error } = await supabase
      .from("apply_message")
      .update({ is_read: true })
      .in("id", messageIds)
      .eq("request_id", request_id);

    if (error) console.error("Error marking messages as read:", error);
  };

  useEffect(() => {
    if (!user?.id) return;

    const unreadMessages = chatData
      .filter((msg) => !msg.is_read && msg.sender_id !== user.id)
      .map((msg) => msg.id);

    if (unreadMessages.length > 0) {
      markAsRead(unreadMessages);
    }
  }, [chatData, user?.id]);

  // 日付ごとにメッセージをグループ化する関数
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
    messages.forEach((message) => {
      const date = format(new Date(message.created_at), "yyyy/MM/dd (E)", {
        locale: ja,
      });
      const lastGroup = groupedMessages[groupedMessages.length - 1];
      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(message);
      } else {
        groupedMessages.push({ date, messages: [message] });
      }
    });
    return groupedMessages;
  };

  const groupedMessages = groupMessagesByDate(chatData);

  // 時間をフォーマットする関数
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-20 px-4">
        <ul className="space-y-4">
          {groupedMessages.map((group) => (
            <li key={group.date} className="space-y-4">
              {/* 日付表示 */}
              <div className="flex justify-center">
                <span className="px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded-full">
                  {group.date}
                </span>
              </div>
              {/* メッセージ表示 */}
              <ul className="space-y-4">
                {group.messages.map((item) => (
                  <li
                    key={item.id}
                    className={`flex ${
                      user?.id === item.sender_id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        user?.id === item.sender_id
                          ? "inline-block rounded-md p-2 bg-green-500 text-white"
                          : "inline-block rounded-md p-2 bg-white"
                      } rounded-lg p-3 shadow`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-end mt-1 text-xs">
                        <span
                          className={
                            user?.id === item.sender_id
                              ? "text-yellow-100"
                              : "text-gray-500"
                          }
                        >
                          {/* 変更: formatTime 関数を使用 */}
                          {formatTime(item.created_at)}
                        </span>
                        {user?.id === item.sender_id && (
                          <span className="ml-1 text-xs">
                            {item.is_read ? "既読" : "未読"}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div ref={messagesEndRef} />
      </div>
      <SendButton request_id={request_id} setChatData={setChatData} />
    </div>
  );
}
