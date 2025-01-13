"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { TextbookSchema } from "../../../../schemas";
import { editTextbook } from "../../../../actions/blog";
import { useRouter } from "next/navigation";
import ImageUploading, { ImageListType } from "react-images-uploading";
import toast from "react-hot-toast";
import Image from "next/image";

interface TextbookType {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  subject?: string;
  grade?: number;
  details?: string;
  image_url?: string;
  updated_at: string;
  created_at: string;
}

interface EditTextbookProps {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  subject?: string;
  grade?: number;
  details?: string;
  image_url?: string;
  base64Image?: string;
}

const TextbookEdit = ({ textbook }: { textbook: TextbookType }) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [imageUpload, setImageUpload] = useState<ImageListType>([
    {
      dataURL: textbook.image_url || "/images/noimage.png",
    },
  ]);

  const form = useForm<z.infer<typeof TextbookSchema>>({
    resolver: zodResolver(TextbookSchema),
    defaultValues: {
      title: textbook.title,
      author: textbook.author,
      subject: textbook.subject,
      grade: textbook.grade,
      details: textbook.details,
    },
  });

  // 送信
  const onSubmit = (values: z.infer<typeof TextbookSchema>) => {
    setError("");

    let newImageUrl = textbook.image_url;
    if (imageUpload.length > 0) {
      console.log("選択された画像:", imageUpload[0]);
      newImageUrl = imageUpload[0].dataURL;
    }

    startTransition(async () => {
      try {
        const res = await editTextbook({
          ...values,
          id: textbook.id,
          imageUrl: newImageUrl,
          userId: textbook.user_id,
        });

        if (res?.error) {
          setError(res.error);
          return;
        }

        toast.success("教科書を編集しました");

        router.push(`/mypage/${textbook.id}`);
        router.refresh();
      } catch (error) {
        console.error(error);
        setError("エラーが発生しました");
      }
    });
  };

  // 画像アップロード
  const onChangeImage = (imageList: ImageListType) => {
    setImageUpload(imageList);
  };

  return (
    <div className="mx-auto max-w-screen-md">
      <div className="font-bold text-xl text-center mb-10">教科書編集</div>

      <div className="mb-5">
        <ImageUploading
          value={imageUpload}
          onChange={onChangeImage}
          maxNumber={1}
          acceptType={["jpg", "png", "jpeg"]}
        >
          {({ imageList, onImageUpload, onImageUpdate, dragProps }) => (
            <div className="flex flex-col items-center justify-center">
              {imageList.length == 0 && (
                <button
                  onClick={onImageUpload}
                  className="aspect-video w-full border-2 border-dashed rounded hover:bg-gray-50"
                  {...dragProps}
                >
                  <div className="text-gray-400 font-bold mb-2 text-sm">
                    ファイル選択またはドラッグ＆ドロップ
                  </div>
                  <div className="text-gray-400 text-xs">
                    ファイル形式：jpg / jpeg / png
                  </div>
                  <div className="text-gray-400 text-xs">
                    ファイルサイズ：2MBまで
                  </div>
                </button>
              )}

              {imageList.map((image, index) => (
                <div key={index}>
                  {image.dataURL && (
                    <div className="relative">
                      <Image
                        src={image.dataURL}
                        alt="image"
                        width={768}
                        height={432}
                        priority={true}
                      />
                    </div>
                  )}
                </div>
              ))}

              {imageList.length > 0 && (
                <div className="text-center mt-3">
                  <button
                    className="outline-button"
                    onClick={(e) => {
                      e.preventDefault();
                      onImageUpdate(0);
                    }}
                  >
                    画像を変更
                  </button>
                </div>
              )}
            </div>
          )}
        </ImageUploading>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4 w-full">
          {error && <div className="text-red-600">{error}</div>}

          <button
            type="submit"
            className="w-full space-x-2 font-bold"
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            <span>編集</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TextbookEdit;
