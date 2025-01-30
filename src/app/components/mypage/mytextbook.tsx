"use client";

import { BookType } from "../../../../types";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

interface BookItemProps {
  book: BookType;
}

const BookItem = ({ book }: BookItemProps) => {
  return (
    <div className="break-words border rounded">
      <Link href={`mypage/${book.id}`}>
        {" "}
        {/* 変更: hrefをwish-list/${book.id}からmypage/${book.id}に変更 */}
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={book.image_url || "/images/noimage.png"}
            className="rounded-t object-cover transition-transform duration-100 ease-in-out hover:scale-105"
            alt="image"
            width={640}
            height={360}
            priority
          />
        </div>
      </Link>

      <div className="p-3 space-y-2">
        <div className="text-gray-500 text-xs">
          {format(new Date(book.updated_at), "yyyy/MM/dd HH:mm")}
        </div>
        <div className="font-bold">{book.title}</div>
      </div>
    </div>
  );
};

export default BookItem;
