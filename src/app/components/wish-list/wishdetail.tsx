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
    return description.replace(/\n/g, "<br/>");
  };
  const ogImage = useMemo(() => {
    return book.image_url || "/images/noimage.png";
  }, [book.image_url]);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
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
        url={`https://www.example.com/textbook/${book.id}`}
        title={book.title}
        images={ogImage ? [ogImage] : []}
        datePublished={book.created_at}
        authorName="Author Name"
        description={book.details}
      />

      {/* メイン画像 */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src={ogImage}
          alt={book.title}
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </div>

      {/* タイトル */}
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}
      >
        {book.title}
      </h1>
      {/* 更新日時 */}
      <p style={{ marginBottom: "10px" }}>{formatDate(book.updated_at)}</p>
      {/* 著者 */}
      {book.author && <p style={{ marginBottom: "20px" }}>{book.author}</p>}

      {/* 詳細 */}
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "10px" }}
        >
          詳細
        </h2>
        <p>{parse(formatDescription(book.details))}</p>
      </div>

      {/* 科目 / 学年 / ISBN */}
      <div style={{ marginBottom: "20px" }}>
        <p>科目: {book.subject ? book.subject : "未設定"}</p>
        <p>学年: {book.grade ? book.grade : "未設定"}</p>
        <p>ISBN: {book.isbn ? book.isbn : "未設定"}</p>
      </div>

      {/* リクエスト関連 */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        {/* リクエストがない時 → リクエストボタンを表示 */}
        {!requestRecord && (
          <button
            onClick={handleRequest}
            className="w-full text-white bg-yellow-500 hover:brightness-110 rounded py-1 px-8 mb-4"
          >
            リクエスト
          </button>
        )}

        {/* リクエストがある時 → リクエスト削除ボタンを表示 */}
        {requestRecord && (
          <button
            onClick={handleDeleteRequest}
            className={`w-full text-white rounded py-1 px-8 ${
              isDeleteRequestDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:brightness-110"
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
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={handleDeleteWantbook}
          className={`w-full text-white rounded py-1 px-8 ${
            isWantbookDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:brightness-110"
          }`}
          disabled={isWantbookDisabled}
        >
          欲しい教科書から削除
        </button>
      </div>

      {/* メッセージ表示 */}
      {error && (
        <div style={{ color: "red", textAlign: "center" }}>{error}</div>
      )}
      {message && (
        <div style={{ color: "green", textAlign: "center" }}>{message}</div>
      )}
    </div>
  );
};

export default WishDetail;
