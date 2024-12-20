"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import { BookType } from "../../../../../types";
import SearchDetail from "@/app/components/search/searchdetails";
import { useParams } from "next/navigation";

const BookDetailPage = () => {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const [bookData, setBookData] = useState<BookType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBookData = async () => {
      const { data: bookData, error: bookError } = await supabase
        .from("textbook")
        .select("*")
        .eq("id", id)
        .single();

      if (bookError) {
        console.error("Error fetching book data:", bookError);
        setLoading(false);
        return;
      }

      setBookData(bookData);
      setLoading(false);
    };

    fetchBookData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>読み込み中...</div>
    );
  }

  if (!bookData) {
    return <div className="text-center">教科書が存在しません</div>;
  }

  return <SearchDetail book={bookData} isMyBook={true} />;
};

export default BookDetailPage;
