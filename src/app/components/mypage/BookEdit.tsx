"use client";

import { useState, useEffect, FormEvent } from "react";
import { supabase } from "../../../../lib/supabase"; // ★ 直接インポート
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// ファイル名正規化関数 (日本語・スペースを安全な文字に変換)
function normalizeFilename(originalName: string): string {
  return originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

type Textbook = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  subject: string | null;
  grade: number | null;
  details: string | null;
  isbn: string | null;
  image_url: string | null;
};

export default function EditTextbookForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const textbookId = searchParams.get("id");

  const [userId, setUserId] = useState<string | null>(null);
  const [textbook, setTextbook] = useState<Textbook | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [details, setDetails] = useState("");
  const [isbn, setIsbn] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // ユーザー情報の取得
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    })();
  }, []);

  // テキスト情報の取得
  useEffect(() => {
    if (!textbookId) return;

    const fetchData = async () => {
      const { data, error } = await supabase
        .from("textbook")
        .select("*")
        .eq("id", textbookId)
        .single();

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      if (data) {
        setTextbook(data);
        setTitle(data.title ?? "");
        setAuthor(data.author ?? "");
        setSubject(data.subject ?? "");
        setGrade(data.grade ?? null);
        setDetails(data.details ?? "");
        setIsbn(data.isbn ?? "");
        setExistingImageUrl(data.image_url ?? "");
      }
    };

    fetchData();
  }, [textbookId]);

  // 画像選択
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setImageFile(e.target.files[0]);
  };

  // フォーム送信
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!textbook) {
      alert("編集対象がありません。");
      return;
    }
    if (!userId) {
      alert("ユーザーが未ログインです。");
      return;
    }

    try {
      let newImageUrl = existingImageUrl;

      // 画像を差し替える場合
      if (imageFile) {
        // 古い画像を削除
        if (existingImageUrl) {
          const { path } = extractBucketAndPathFromPublicUrl(existingImageUrl);
          if (path) {
            await supabase.storage.from("textbook").remove([path]);
          }
        }

        // ファイル名を正規化し、アップロードパスを作る
        const safeName = normalizeFilename(imageFile.name);
        const filePath = `${userId}/${uuidv4()}_${safeName}`;

        const { data: storageData, error: storageError } = await supabase.storage
          .from("textbook")
          .upload(filePath, imageFile);

        if (storageError) {
          console.error("Upload error:", storageError);
          alert(`画像アップロードに失敗しました: ${storageError.message}`);
          return;
        }

        // 公開URLを取得
        const { data: publicUrlData } = supabase.storage
          .from("textbook")
          .getPublicUrl(storageData.path);

        if (publicUrlData?.publicUrl) {
          newImageUrl = publicUrlData.publicUrl;
        }
      }

      // DB更新
      const { error: updateError } = await supabase
        .from("textbook")
        .update({
          title,
          author,
          subject,
          grade,
          details,
          isbn,
          image_url: newImageUrl,
        })
        .eq("id", textbook.id);

      if (updateError) {
        throw updateError;
      }

      alert("更新が完了しました");
      router.push("/mypage");
      router.refresh();
    } catch (err: any) {
      console.error("Error updating textbook:", err);
      alert("更新時にエラーが発生しました: " + err.message);
    }
  };

  // ストレージ上のパスを取り出す
  const extractBucketAndPathFromPublicUrl = (url: string) => {
    const bucket = "textbook";
    const idx = url.indexOf(bucket + "/");
    if (idx === -1) return { bucket: "", path: "" };
    const path = url.substring(idx + bucket.length + 1);
    return { bucket, path };
  };

  // --- レンダリング ---
  return (
    <div className="max-w-screen-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">教科書の編集</h1>

      {!textbook ? (
        <p>データを読み込み中...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* タイトル */}
          <div>
            <label className="block mb-1 font-semibold" htmlFor="title">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded border-gray-300 focus:ring focus:ring-yellow-400 px-3 py-2"
            />
          </div>

          {/* 著者 */}
          <div>
            <label className="block mb-1 font-semibold" htmlFor="author">
              著者
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded border-gray-300 focus:ring focus:ring-yellow-400 px-3 py-2"
            />
          </div>

          {/* 科目 */}
          <div>
            <label className="block mb-1 font-semibold" htmlFor="subject">
              科目
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded border-gray-300 focus:ring focus:ring-yellow-400 px-3 py-2"
            />
          </div>

          {/* 学年 */}
          <div>
            <label className="block mb-1 font-semibold" htmlFor="grade">
              学年
            </label>
            <input
              id="grade"
              type="number"
              value={grade ?? ""}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full rounded border-gray-300 focus:ring focus:ring-yellow-400 px-3 py-2"
            />
          </div>

          {/* ISBN */}
          <div>
            <label className="block mb-1 font-semibold" htmlFor="isbn">
              ISBN
            </label>
            <input
              id="isbn"
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="w-full rounded border-gray-300 focus:ring focus:ring-yellow-400 px-3 py-2"
            />
          </div>

          {/* 詳細 */}
          <div>
            <label className="block mb-1 font-semibold" htmlFor="details">
              詳細
            </label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded border-gray-300 focus:ring focus:ring-yellow-400 px-3 py-2"
              rows={5}
            />
          </div>

          {/* 既存画像プレビュー */}
          <div>
            <span className="block mb-1 font-semibold">現在の画像</span>
            {existingImageUrl ? (
              <img
                src={existingImageUrl}
                alt="Current"
                className="max-w-[200px] mb-2 border rounded"
              />
            ) : (
              <p className="text-gray-500 mb-2">画像なし</p>
            )}
          </div>

          {/* 画像アップロード */}
          <div>
            <label className="block mb-1 font-semibold" htmlFor="newImage">
              画像を変更する
            </label>
            <input
              id="newImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block"
            />
          </div>

          {/* 更新ボタン */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-yellow-500 text-white font-semibold px-6 py-2 rounded hover:brightness-110 transition"
            >
              更新する
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
