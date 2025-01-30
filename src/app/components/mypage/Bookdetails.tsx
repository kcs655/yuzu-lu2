"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { BookType, RequestType } from "../../../../types";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArticleJsonLd, NextSeo } from "next-seo";
import { FilePenLine, Loader2, Trash2 } from "lucide-react";
import parse from "html-react-parser";

interface BookDetailProps {
  book: BookType;
  isMyBook: boolean;
}

const BookDetail: React.FC<BookDetailProps> = ({ book, isMyBook }) => {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data: requestData, error } = await supabase
        .from("request")
        .select("*, profiles!request_requester_id_fkey1(email)")
        .eq("textbook_id", book.id);

      if (error) {
        console.error("Error fetching requests:", error);
        setIsLoading(false);
        return;
      }
      setRequests(requestData as RequestType[]);
      setIsLoading(false);
    };

    fetchRequests();

    const channel = supabase
      .channel(`request-changes-${book.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "request",
          filter: `textbook_id=eq.${book.id}`,
        },
        async (payload) => {
          console.log("Change received!", payload);

          // 変更があった場合は、プロフィール情報も含めて最新データを取得
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const { data: updatedRequest, error } = await supabase
              .from("request")
              .select("*, profiles!request_requester_id_fkey1(email)")
              .eq("id", payload.new.id)
              .single();

            if (!error && updatedRequest) {
              setRequests((prevRequests) => {
                const existingIndex = prevRequests.findIndex(
                  (req) => req.id === updatedRequest.id
                );
                return existingIndex >= 0
                  ? prevRequests.map((req) =>
                      req.id === updatedRequest.id ? updatedRequest : req
                    )
                  : [...prevRequests, updatedRequest];
              });
            }
          } else if (payload.eventType === "DELETE") {
            // 削除の場合はすぐにstateから削除
            console.log("Removing request:", payload.old.id);
            setRequests((prevRequests) =>
              prevRequests.filter((req) => req.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      prevRequests.map((req) =>
        req.id === requestId ? { ...req, status } : req
      )
    );
  };

  const handleDelete = async () => {
    if (!window.confirm("本当に削除しますか？")) {
      return;
    }

    setIsLoading(true);

    try {
      // 教科書削除
      const { error } = await supabase
        .from("textbook")
        .delete()
        .eq("id", book.id);

      if (error) {
        console.error(`Delete error: ${JSON.stringify(error)}`);
        setIsLoading(false);
        return;
      }

      // 画像がある場合、画像を削除
      if (book.image_url) {
        const fileName = book.image_url.split("/").slice(-1)[0];
        const { error: storageError } = await supabase.storage
          .from("textbook")
          .remove([`${book.user_id}/${fileName}`]);

        if (storageError) {
          console.error(
            `Storage delete error: ${JSON.stringify(storageError)}`
          );
          setIsLoading(false);
          return;
        }
      }

      toast.success("教科書を削除しました");
      setIsLoading(false);

      // ページをリフレッシュしてmypageに移動
      router.push("/mypage");
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
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
          {/* 左カラム: 画像 */}
          <div className="space-y-4">
            <div className="aspect-w-3 aspect-h-4 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={ogImage}
                alt={book.title}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* 右カラム: 基本情報 */}
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

            {/* 基本情報カード */}
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

            {/* 編集/削除ボタン */}
            {isMyBook && (
              <div className="flex justify-end space-x-4">
                <Link
                  href={`/mypage/${book.id}/edit?id=${book.id}`}
                  className="flex items-center text-yellow-600 hover:text-yellow-700 transition-colors"
                >
                  <FilePenLine className="w-5 h-5 mr-1" />
                  <span>編集</span>
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5 mr-1" />
                      <span>削除</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 詳細説明 */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">詳細</h2>
          <div className="prose max-w-none">
            {parse(formatDescription(book.details))}
          </div>
        </div>

        {/* リクエスト一覧 */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            リクエスト一覧
          </h2>
          <div className="space-y-4">
            {requests.filter((req) => req.status === "wait").length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                現在、待機中のリクエストはありません。
              </p>
            ) : (
              requests
                .filter((req) => req.status === "wait")
                .map((request) => (
                  <div
                    key={request.id}
                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        メールアドレス:{" "}
                        <span className="font-medium text-gray-900">
                          {request.profiles?.email || "メールアドレス不明"}
                        </span>
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() =>
                          handleStatusChange(request.id, "consent")
                        }
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                      >
                        承諾
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(request.id, "rejection")
                        }
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      >
                        拒否
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
