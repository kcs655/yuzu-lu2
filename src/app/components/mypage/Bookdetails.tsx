"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { BookType } from "../../../../types"
import { format } from "date-fns"
import { FilePenLine, Loader2, Trash2 } from "lucide-react"
import { deleteBook } from "../../../../actions/blog"

import Image from "next/image"
import Link from "next/link"
import toast from "react-hot-toast"

interface BookDetailProps {
  book: BookType
  isMyBook: boolean
}

const BookDetail = ({ book, isMyBook }: BookDetailProps) => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleDelete = async () => {
    if (!window.confirm("本当に削除しますか？")) {
      return
    }

    setError("")

    startTransition(async () => {
      try {
        const res = await deleteBook({
          bookId: book.id,
          imageUrl: book.image_url,
          userId: book.user_id,
        })

        if (res?.error) {
          setError(res.error)
          return
        }

        toast.success("教科書を削除しました")
        router.push("/mypage")
        router.refresh()
      } catch (error) {
        console.error(error)
        setError("エラーが発生しました")
      }
    })
  }

  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-5">
        <div className="text-sm text-gray-500">
          {format(new Date(book.updated_at), "yyyy/MM/dd HH:mm")}
        </div>
        <div className="font-bold text-2xl">{book.title}</div>
        <div>
          <Image
            src={book.image_url || "/noImage.png"}
            className="rounded object-cover"
            alt="image"
            width={768}
            height={432}
            priority
          />
        </div>
        <div className="leading-relaxed break-words whitespace-pre-wrap">
          {book.details}
        </div>

        {isMyBook && (
          <div className="flex items-center justify-end space-x-3">
            <Link href={`/mypage/${book.id}/edit`}>
              <FilePenLine className="w-6 h-6" />
            </Link>
            <button
              className="cursor-pointer"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-6 w-6 animate-spin text-red-500" />
              ) : (
                <Trash2 className="w-6 h-6 text-red-500" />
              )}
            </button>
          </div>
        )}

      </div>

      
    </div>
  )
}

export default BookDetail
