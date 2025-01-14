"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import BookItem from "@/app/components/mypage/mytextbook";
import useStore from "../../../../store";
import { BookType } from "../../../../types";

const MainPage = () => {
  const { user, setUser } = useStore();
  const [books, setBooks] = useState<BookType[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);

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
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error fetching books:", error);
          return;
        }

        if (!booksData || booksData.length === 0) {
          console.log("No books found for user:", user.id);
          setBooks([]);
        } else {
          setBooks(booksData);
        }
        setLoadingBooks(false);
      }
    };

    fetchBooks();
  }, [user?.id]);

  if (loadingUser) {
    return <div className="text-center">ユーザー情報を取得中...</div>;
  }

  if (loadingBooks) {
    return <div className="text-center">教科書を取得中...</div>;
  }

  if (books.length === 0) {
    return <div className="text-center">教科書が投稿されていません</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-5">
      {books.map((book) => (
        <BookItem key={book.id} book={book} />
      ))}
    </div>
  );
};

export default MainPage;
