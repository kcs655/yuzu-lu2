"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { BookType } from "../../../../types";
import useStore from "../../../../store";
import WishItem from "./wish-item";

const WishList = () => {
  const { user } = useStore();
  const [wishlist, setWishlist] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (user?.id) {
        const { data: wishlistData, error } = await supabase
          .from("wantbook")
          .select("textbook(*)") // textbookテーブルのデータも一緒に取得
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching wishlist:", error);
          return;
        }

        if (wishlistData) {
          // `any[][]` から `BookType[]` への変換を明示的に行う
          const books = wishlistData.map(
            (item: any) => item.textbook
          ) as BookType[];
          setWishlist(books);
        }
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="text-center">欲しい教科書リストを読み込んでいます...</div>
    );
  }

  if (wishlist.length === 0) {
    return <div className="text-center">欲しい教科書リストが空です。</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-5">
      {wishlist.map((book) => (
        <WishItem key={book.id} book={book} />
      ))}
    </div>
  );
};

export default WishList;
