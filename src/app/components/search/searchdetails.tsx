"use client";

import { useState, useEffect, useMemo } from "react";
import { BookType } from "../../../../types";
import { supabase } from "../../../../lib/supabase";
import parse from "html-react-parser";
import { ArticleJsonLd, NextSeo } from "next-seo";
import { v4 as uuidv4 } from "uuid";
import useStore from "../../../../store";

interface BookDetailProps {
  book: BookType;
  isMyBook?: boolean;
}

const SearchDetail = ({ book }: BookDetailProps) => {
  const { user, setUser } = useStore();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);

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

  // 「欲しい教科書リスト」に追加済みかどうかチェック
  useEffect(() => {
    const checkWishlist = async () => {
      if (user?.id) {
        const { data: wishlistData, error } = await supabase
          .from("wantbook")
          .select("*")
          .eq("user_id", user.id)
          .eq("textbook_id", book.id);

        if (wishlistData && wishlistData.length > 0) {
          setIsDisabled(true);
        }

        if (error) {
          console.error("Error checking wishlist:", error.message);
        }
      }
    };

    checkWishlist();
  }, [user?.id, book.id]);

  // 「欲しい教科書リストに追加」ボタン押下
  const handleAddToWishlist = async () => {
    if (user.id) {
      const { error: insertError } = await supabase.from("wantbook").insert({
        id: uuidv4(),
        user_id: user.id,
        textbook_id: book.id,
        is_disabled: true, // ボタンが押された後はtrueに設定
      });

      if (insertError) {
        setError(insertError.message);
        setMessage("");
      } else {
        setMessage("教科書が欲しいリストに追加されました。");
        setError("");
        setIsDisabled(true); // ボタンを無効化
      }
    } else {
      setError("ユーザー情報が取得できませんでした。");
      setMessage("");
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "不明";
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

  const ogImage = useMemo(() => {
    return book.image_url || "/images/noimage.png";
  }, [book.image_url]);

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
        url={`https://www.example.com/textbook/${book.id}`} 
        title={book.title}
        images={ogImage ? [ogImage] : []}
        datePublished={book.created_at}
        authorName="Author Name" 
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

            {/* 基本情報 */}
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
          </div>
        </div>

        {/* 詳細説明 */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">詳細</h2>
          <div className="prose max-w-none">
            {parse(formatDescription(book.details))}
          </div>
        </div>
        {/* 「欲しい」ボタン */}
        <div className="mt-8">
          <button
            onClick={handleAddToWishlist}
            className={`w-full text-white rounded-md py-2 px-4 transition-colors ${
              isDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-600"
            }`}
            disabled={isDisabled}
          >
            欲しい教科書リストに追加
          </button>
          {/* メッセージ表示 */}
          <div className="text-center mt-4">
            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-500">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDetail;
