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

const SearchDetail = ({ book}: BookDetailProps) => {
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
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}
      >
        {book.title}
      </h1>
      <p style={{ marginBottom: "10px" }}>{formatDate(book.updated_at)}</p>
      {book.author && <p style={{ marginBottom: "20px" }}>{book.author}</p>}
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "10px" }}
        >
          詳細
        </h2>
        <p>{parse(formatDescription(book.details))}</p>
      </div>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={handleAddToWishlist}
          className={`w-full text-white ${
            isDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-500 hover:brightness-110"
          } rounded py-1 px-8`}
          disabled={isDisabled}
        >
          欲しい教科書リストに追加
        </button>
        {error && (
          <div style={{ color: "red", textAlign: "center" }}>{error}</div>
        )}
        {message && (
          <div style={{ color: "green", textAlign: "center" }}>{message}</div>
        )}
      </div>
    </div>
  );
};

export default SearchDetail;
