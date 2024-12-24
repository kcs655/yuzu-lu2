"use client";

import { useState, useEffect, useTransition } from "react";
import { supabase } from "../../../../lib/supabase";
import { BookType, RequestType } from "../../../../types";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArticleJsonLd, NextSeo } from "next-seo";
import { FilePenLine, Loader2, Trash2 } from "lucide-react";
import parse from "html-react-parser"; // ここに追加

interface BookDetailProps {
  book: BookType;
  isMyBook: boolean;
}

const deleteBook = async ({ bookId, imageUrl, userId }: any) => {
  const { error } = await supabase.from("textbook").delete().eq("id", bookId);
  return { error };
};

const BookDetail = ({ book, isMyBook }: BookDetailProps) => {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data: requestData, error } = await supabase
        .from("request")
        .select("*")
        .eq("textbook_id", book.id); // textbook_id が一致するデータを取得

      if (error) {
        console.error("Error fetching requests:", error);
        setIsLoading(false);
        return;
      }

      console.log("Fetched requests:", requestData);
      setRequests(requestData);
      setIsLoading(false);
    };

    fetchRequests();
  }, [book.id]);

  const handleStatusChange = async (requestId: string, status: string) => {
    const { error } = await supabase
      .from("request")
      .update({ status })
      .eq("id", requestId);

    if (error) {
      console.error(`Error updating request status to ${status}:`, error);
      return;
    }

    setRequests((prevRequests) =>
      prevRequests.map((request) =>
        request.id === requestId ? { ...request, status } : request
      )
    );
  };

  const handleDelete = async () => {
    if (!window.confirm("本当に削除しますか？")) {
      return;
    }

    setError("");
    setIsLoading(true);

    startTransition(async () => {
      try {
        const res = await deleteBook({
          bookId: book.id,
          imageUrl: book.image_url,
          userId: book.user_id,
        });

        if (res?.error) {
          setError(res.error.message);
          setIsLoading(false);
          return;
        }

        toast.success("教科書を削除しました");
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setError("エラーが発生しました");
        setIsLoading(false);
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

  const ogImage = book.image_url || "/images/noimage.png";

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
        url={`https://www.example.com/textbook/${book.id}`} // 実際のドメインに修正
        title={book.title}
        images={ogImage ? [ogImage] : []}
        datePublished={book.created_at}
        authorName="Author Name" // 実際の著者名に修正
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
      {isMyBook && (
        <div className="flex items-center justify-end space-x-3">
          <Link href={`/mypage/${book.id}/edit`}>
            <FilePenLine className="w-6 h-6" />
          </Link>
          <button
            className="cursor-pointer"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-red-500" />
            ) : (
              <Trash2 className="w-6 h-6 text-red-500" />
            )}
          </button>
        </div>
      )}
      <div style={{ marginTop: "40px" }}>
        <h2>リクエスト一覧</h2>
        {requests.filter((request) => request.status === "wait").length ===
        0 ? (
          <p>現在、待機中のリクエストはありません。</p>
        ) : (
          requests
            .filter((request) => request.status === "wait")
            .map((request) => (
              <div key={request.id} style={{ marginBottom: "20px" }}>
                <p>リクエストID: {request.id}</p>
                <p>ステータス: {request.status}</p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    className="cursor-pointer"
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#5cb85c",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      marginRight: "10px",
                    }}
                    onClick={() => handleStatusChange(request.id, "consent")}
                  >
                    承諾
                  </button>
                  <button
                    className="cursor-pointer"
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#d9534f",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleStatusChange(request.id, "rejection")}
                  >
                    拒否
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default BookDetail;
