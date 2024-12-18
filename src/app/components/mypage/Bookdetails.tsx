"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookType } from "../../../../types";
import { format } from "date-fns";
import { FilePenLine, Loader2, Trash2 } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import parse from "html-react-parser";
import { ArticleJsonLd, NextSeo } from "next-seo";

interface BookDetailProps {
  book: BookType;
  isMyBook: boolean;
}

const deleteBook = async ({ bookId, imageUrl, userId }: any) => {
  const { error } = await supabase.from("textbook").delete().eq("id", bookId);
  return { error };
};

const BookDetail = ({ book, isMyBook }: BookDetailProps) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!window.confirm("本当に削除しますか？")) {
      return;
    }

    setError("");

    startTransition(async () => {
      try {
        const res = await deleteBook({
          bookId: book.id,
          imageUrl: book.image_url,
          userId: book.user_id,
        });

        if (res?.error) {
          setError(res.error.message);
          return;
        }

        toast.success("教科書を削除しました");
        router.push("/mypage");
        router.refresh();
      } catch (error) {
        console.error(error);
        setError("エラーが発生しました");
      }
    });
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
    let sanitizedDescription = description.replace(/\n/g, "<br/>");
    return sanitizedDescription;
  };

  const ogImage = useMemo(() => {
    return book.image_url || "";
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
      {book.image_url && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src={book.image_url}
            alt={book.title}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
      )}
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
        <Link href={`/mypage/${book.id}/edit`}>
          <FilePenLine className="w-6 h-6" />
        </Link>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#d9534f",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin text-red-500" />
          ) : (
            <Trash2 className="w-6 h-6 text-red-500" />
          )}
        </button>
        {error && (
          <div style={{ color: "red", textAlign: "center" }}>{error}</div>
        )}
      </div>
    </div>
  );
};

export default BookDetail;
