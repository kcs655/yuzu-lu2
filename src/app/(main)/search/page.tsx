"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../../../lib/supabase";
import BookItem from "@/app/components/mypage/mytextbook";
import useStore from "../../../../store";
import { BookType } from "../../../../types";
import { useRouter } from "next/navigation";

const MainPage = () => {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [books, setBooks] = useState<BookType[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
      setLoadingUser(false);
    };

    fetchUser();
  }, [setUser]);

  useEffect(() => {
    const fetchBooks = async () => {
      if (user?.id) {
        const { data: booksData, error } = await supabase
          .from("textbook")
          .select("*")
          .neq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error fetching books:", error);
          return;
        }

        if (!booksData || booksData.length === 0) {
          console.log("No books found for other users");
          setBooks([]);
        } else {
          setBooks(booksData);
        }
        setLoadingBooks(false);
      }
    };

    fetchBooks();
  }, [user?.id]);

  // searchTermを用いて書籍一覧をフィルタリング
  const filteredBooks = useMemo(() => {
    if (!searchTerm) return books;
    // タイトルで絞り込み(大文字小文字区別なし)
    const lowerTerm = searchTerm.toLowerCase();
    return books.filter((book) =>
      book.title.toLowerCase().includes(lowerTerm)
    );
  }, [books, searchTerm]);

  if (loadingUser) {
    return <div className="text-center">ユーザー情報を取得中...</div>;
  }

  if (loadingBooks) {
    return <div className="text-center">教科書を取得中...</div>;
  }

  return (
    <div>
      {/* 検索バー */}
      <div className="mb-4">
        <input
          type="text"
          className="border p-2 w-full"
          placeholder="教科書タイトルで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredBooks.length === 0 ? (
        <div className="text-center">
          {searchTerm
            ? "該当する教科書が見つかりませんでした。"
            : "他のユーザーが投稿した教科書が見つかりませんでした"}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {filteredBooks.map((book) => (
            <BookItem key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MainPage;
