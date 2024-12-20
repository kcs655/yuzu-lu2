"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import SearchItem from "@/app/components/search/search";
import useStore from "../../../../store";
import { BookType } from "../../../../types";
import { useRouter } from "next/navigation"; // useRouterをnext/navigationからimport

const SearchPage = () => {
  const router = useRouter();
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
          .neq("user_id", user.id) // .eqから.neqに変更
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

  if (loadingUser) {
    return <div className="text-center">ユーザー情報を取得中...</div>;
  }

  if (loadingBooks) {
    return <div className="text-center">教科書を取得中...</div>;
  }

  if (books.length === 0) {
    return <div className="text-center">他のユーザーが投稿した教科書が見つかりませんでした</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-5">
      {books.map((book) => (
        <SearchItem key={book.id} book={book} />
      ))}
    </div>
  );
};

export default SearchPage;
