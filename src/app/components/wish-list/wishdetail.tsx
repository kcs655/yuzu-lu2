"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookType } from "../../../../types";
import { supabase } from "../../../../lib/supabase";
import parse from "html-react-parser";
import { ArticleJsonLd, NextSeo } from "next-seo";
import { v4 as uuidv4 } from "uuid";
import useStore from "../../../../store";

interface WishDetailProps {
  book: BookType;
  isMyBook: boolean;
}

// requestテーブルのレコードを型定義（status等も含む）
interface RequestRecord {
  id: string;
  requester_id: string;
  textbook_id: string;
  status: string; // 'wait', 'consent', 'rejection'など
}

const WishDetail = ({ book }: WishDetailProps) => {
  const { user, setUser } = useStore();
  const router = useRouter();

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // requestテーブルのレコードを丸ごと保持
  // (null ならリクエストなし)
  const [requestRecord, setRequestRecord] = useState<RequestRecord | null>(
    null
  );

  // wantbookテーブル削除ボタンを押せるか？ → requestがある場合は無効化
  const isWantbookDisabled = !!requestRecord;

  // 「リクエストを削除」ボタンを押せるか？ → statusが"consent"なら無効化
  const isDeleteRequestDisabled =
    requestRecord?.status === "consent" ? true : false;

  // useRefを使用して、現在のサブスクリプションを追跡
  const currentSubscription = useRef<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user data:", error);
      } else {
        setUser({ id: user?.id, email: user?.email });
        console.log("Fetched user:", user);
      }
    };

    fetchUser();
  }, [setUser]);

  // 既にリクエストがあるかどうかチェック + Realtime Listener
  useEffect(() => {
    // リクエストを確認する関数 (Realtime Listener と DELETE イベントハンドラから呼び出す)
    const checkRequest = async () => {
      console.log("Checking request...");
      if (user?.id) {
        const { data: requestData, error } = await supabase
          .from("request")
          .select("*")
          .eq("requester_id", user.id)
          .eq("textbook_id", book.id);

        if (error) {
          console.error("Error checking request:", error.message);
          return;
        }

        console.log("Request data:", requestData);

        // もし既にレコードがあれば、最初の1件を保持
        if (requestData && requestData.length > 0) {
          setRequestRecord(requestData[0]);
        } else {
          setRequestRecord(null);
        }
      }
    };

    // コンポーネントのマウント時にリクエストを確認
    checkRequest();

    // ユーザーが変更された場合、またはコンポーネントがアンマウントされる場合に、
    // 前のサブスクリプションをクリーンアップ
    if (currentSubscription.current) {
      supabase.removeChannel(currentSubscription.current);
      currentSubscription.current = null;
    }

    // Realtime Listener の設定
    const channelName = `request-changes-book-${book.id}`;
    console.log("Channel name:", channelName);

    const requestSubscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "request",
          filter: `textbook_id=eq.${book.id}`,
        },
        async (payload) => {
          console.log("Realtime event received:", payload);

          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            if (
              typeof payload.new === "object" &&
              payload.new !== null &&
              "requester_id" in payload.new &&
              user?.id &&
              payload.new.requester_id === user.id
            ) {
              // 最新のデータを取得して設定
              const { data, error } = await supabase
                .from("request")
                .select("*")
                .eq("id", payload.new.id)
                .single();

              if (!error && data) {
                console.log("Setting request record:", data);
                setRequestRecord(data as RequestRecord);
              }
            }
          } else if (payload.eventType === "DELETE") {
            if (requestRecord && payload.old.id === requestRecord.id) {
              console.log("Clearing request record after DELETE");
              setRequestRecord(null);
            }
          }
        }
      )
      .subscribe();

    // サブスクリプションを保存
    currentSubscription.current = requestSubscription;

    // Cleanup function
    return () => {
      if (currentSubscription.current) {
        supabase.removeChannel(currentSubscription.current);
        currentSubscription.current = null;
      }
    };
  }, [user?.id, book.id]);

  // リクエストボタン押下 → requestにINSERT
  const handleRequest = async () => {
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from("request")
          .insert({
            id: uuidv4(),
            requester_id: user.id,
            textbook_id: book.id,
            status: "wait", // 初期値を明示しておく
          })
          .select()
          .single();

        if (error) {
          setError(error.message);
          setMessage("");
          return;
        }

        setMessage("リクエストが送信されました。");
        setError("");
      } catch (err: any) {
        console.error("Insert request error:", err);
        setError("リクエスト送信中にエラーが発生しました。");
        setMessage("");
      }
    } else {
      setError("ユーザー情報が取得できませんでした。");
      setMessage("");
    }
  };

  // リクエストを削除 → requestテーブルからDELETE
  const handleDeleteRequest = async () => {
    if (!requestRecord || !user?.id) return;

    try {
      const { error } = await supabase
        .from("request")
        .delete()
        .eq("id", requestRecord.id)
        .eq("requester_id", user.id)
        .eq("textbook_id", book.id);

      if (error) {
        setError(error.message);
        setMessage("");
        return;
      }

      setMessage("リクエストを削除しました。");
      setError("");

      setRequestRecord(null);
    } catch (err: any) {
      console.error("Delete request error:", err);
      setError("リクエスト削除中にエラーが発生しました。");
      setMessage("");
    }
  };

  // wantbook から削除 → /wish-list にリダイレクト
  const handleDeleteWantbook = async () => {
    if (!user?.id) {
      setError("ユーザー情報が取得できませんでした。");
      setMessage("");
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("wantbook")
        .delete()
        .eq("user_id", user.id)
        .eq("textbook_id", book.id);

      if (deleteError) {
        setError(deleteError.message);
        setMessage("");
      } else {
        setMessage("wantbook から削除しました。");
        setError("");

        // /wish-list に移動して画面更新
        router.push("/wish-list");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Error deleting from wantbook:", err);
      setError("wantbook レコードの削除時にエラーが発生しました。");
      setMessage("");
    }
  };

  // 日付やテキスト表示処理
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDescription = (description: string): string => {
    if (!description) return "未設定";
    const sanitizedDescription = description.replace(/\n/g, "<br/>");
    return sanitizedDescription;
  };

  const ogImage = book.image_url || "/images/noimage.png";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <NextSeo
        title={book.title}
        openGraph={{
          images: [
            {
              url: ogImage,
              width: 1200,
              height: 630,
            },
          ],
        }}
      />
      <ArticleJsonLd
        type="BlogPosting"
        url={`https://www.example.com/textbook/${book.id}`} // 実際のドメインに修正
        title={book.title}
        images={ogImage ? [ogImage] : []}
        datePublished={book.created_at}
        authorName="Author Name" // 実際の著者名に修正
        description={book.details}
      />

      {/* メインコンテンツエリア */}
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/*  画像 */}
          <div className="space-y-4">
            <div className="aspect-w-3 aspect-h-4 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={ogImage}
                alt={book.title}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* 基本情報 */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {book.title}
              </h1>
              <p className="text-sm text-gray-500">
                更新日: {formatDate(book.updated_at)}
              </p>
              {book.author && (
                <p className="text-md text-gray-700">著者: {book.author}</p>
              )}
            </div>

            {/* 基本情報2 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">科目</p>
                  <p className="font-medium">{book.subject || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">学年</p>
                  <p className="font-medium">{book.grade || "未設定"}年</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">ISBN</p>
                  <p className="font-medium">{book.isbn || "未設定"}</p>
                </div>
              </div>
            </div>
            {/* リクエスト関連 */}
            <div className="text-center">
              {/* リクエストがない時 → リクエストボタンを表示 */}
              {!requestRecord && (
                <button
                  onClick={handleRequest}
                  className="w-full text-white bg-yellow-500 hover:bg-yellow-600 rounded-md py-2 px-4 mb-4 transition-colors"
                >
                  リクエスト
                </button>
              )}

              {/* リクエストがある時 → リクエスト削除ボタンを表示 */}
              {requestRecord && (
                <button
                  onClick={handleDeleteRequest}
                  className={`w-full text-white rounded-md py-2 px-4 transition-colors ${
                    isDeleteRequestDisabled
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                  disabled={isDeleteRequestDisabled}
                >
                  リクエストを削除
                </button>
              )}

              {/* status === "consent"の場合、リクエスト削除ボタンが無効化される */}
              {/* ↑ isDeleteRequestDisabled が true */}
            </div>

            {/* wantbook のレコード削除ボタン (requestがある場合は無効化) */}
            <div className="text-center">
              <button
                onClick={handleDeleteWantbook}
                className={`w-full text-white rounded-md py-2 px-4 transition-colors ${
                  isWantbookDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
                disabled={isWantbookDisabled}
              >
                欲しい教科書から削除
              </button>
            </div>
          </div>
        </div>

        {/* 詳細説明 */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">詳細</h2>
          <div className="prose max-w-none">
            {parse(formatDescription(book.details))}
          </div>
        </div>
      </div>

      {/* メッセージ表示 */}
      {error && (
        <div className="text-center mt-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      {message && (
        <div className="text-center mt-4">
          <p className="text-green-500">{message}</p>
        </div>
      )}
    </div>
  );
};

export default WishDetail;
