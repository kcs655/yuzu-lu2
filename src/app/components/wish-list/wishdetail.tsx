"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation"; // ★ 追加
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

const WishDetail = ({ book }: WishDetailProps) => {
  const { user, setUser } = useStore();
  const router = useRouter(); // ★ useRouter を呼び出す

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isRequestDisabled, setIsRequestDisabled] = useState(false);

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

  useEffect(() => {
    const checkRequest = async () => {
      if (user?.id) {
        const { data: requestData, error } = await supabase
          .from("request")
          .select("*")
          .eq("requester_id", user.id)
          .eq("textbook_id", book.id);

        if (requestData && requestData.length > 0) {
          setIsRequestDisabled(true);
        }

        if (error) {
          console.error("Error checking request:", error.message);
        }
      }
    };

    checkRequest();
  }, [user?.id, book.id]);

  const handleRequest = async () => {
    if (user?.id) {
      const { error: requestError } = await supabase.from("request").insert({
        id: uuidv4(),
        requester_id: user.id,
        textbook_id: book.id,
      });

      if (requestError) {
        setError(requestError.message);
        setMessage("");
      } else {
        setMessage("リクエストが送信されました。");
        setError("");
        setIsRequestDisabled(true);
      }
    } else {
      setError("ユーザー情報が取得できませんでした。");
      setMessage("");
    }
  };

  // ★ wantbook テーブルからデータを削除後、 wish-list ページへリダイレクト
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

        // ★ 削除成功後に /wish-list に遷移してページを再読み込み
        router.push("/wish-list"); 
        router.refresh();
      }
    } catch (err: any) {
      console.error("Error deleting from wantbook:", err);
      setError("wantbook レコードの削除時にエラーが発生しました。");
      setMessage("");
    }
  };

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
        url={`https://www.example.com/textbook/${book.id}`} // 適切なURLに修正
        title={book.title}
        images={ogImage ? [ogImage] : []}
        datePublished={book.created_at}
        authorName="Author Name" // 適切な著者名に修正
        description={book.details}
      />

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src={ogImage}
          alt={book.title}
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </div>

      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>
        {book.title}
      </h1>
      <p style={{ marginBottom: "10px" }}>{formatDate(book.updated_at)}</p>
      {book.author && <p style={{ marginBottom: "20px" }}>{book.author}</p>}

      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "10px" }}>
          詳細
        </h2>
        <p>{parse(formatDescription(book.details))}</p>
      </div>

      {/* リクエストボタン */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={handleRequest}
          className={`w-full text-white ${
            isRequestDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-500 hover:brightness-110"
          } rounded py-1 px-8`}
          disabled={isRequestDisabled}
        >
          リクエスト
        </button>
      </div>

      {/* wantbook のレコード削除ボタン */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={handleDeleteWantbook}
          className="w-full text-white bg-red-500 hover:brightness-110 rounded py-1 px-8"
        >
          欲しい教科書から削除
        </button>
      </div>

      {error && <div style={{ color: "red", textAlign: "center" }}>{error}</div>}
      {message && (
        <div style={{ color: "green", textAlign: "center" }}>{message}</div>
      )}
    </div>
  );
};

export default WishDetail;
