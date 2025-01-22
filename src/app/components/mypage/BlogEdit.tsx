"use client";

import { useState, useEffect, FormEvent } from "react";
import { supabase } from "../../../../lib/supabase"; // ★ 直接インポート
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// ユーザーIDを取得する方法をどこかで用意してください
// 例: useStore() or supabase.auth.getUser() など

// ★ ここで「ファイル名正規化関数」を定義 ★
function normalizeFilename(originalName: string): string {
  // 例: 半角英数字, '.', '-', '_' 以外を '_' に置き換える
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

  // [!] ユーザーIDを使うためのステートを定義 (例)
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

  // ----------------------
  // 1) ユーザー情報の取得 (例)
  // ----------------------
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    })();
  }, []);

  // ----------------------
  // 2) データ取得の useEffect
  // ----------------------
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

  // ------------------------------
  // 画像を選択したときのハンドラ
  // ------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setImageFile(e.target.files[0]);
  };

  // -----------------------------
  // 3) フォーム送信(更新)のハンドラ
  // -----------------------------
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

      // 画像差し替えがある場合
      if (imageFile) {
        // 古い画像削除 (必要に応じて)
        if (existingImageUrl) {
          const { path } = extractBucketAndPathFromPublicUrl(existingImageUrl);
          if (path) {
            await supabase.storage.from("textbook").remove([path]);
          }
        }

        // ★ ここで「ファイル名正規化」
        const originalName = imageFile.name;
        const safeName = normalizeFilename(originalName);

        // ★ ここで userId と uuidv4 を使ってアップロード
        //    (例) "ユーザーID/UUID_正規化したファイル名"
        const filePath = `${userId}/${uuidv4()}_${safeName}`;

        // ---- ここがご要望の箇所 ----
        const { data: storageData, error: storageError } =
          await supabase.storage
            .from("textbook")
            .upload(filePath, imageFile);

        if (storageError) {
          console.error("Upload error:", storageError);
          alert(`画像アップロードに失敗しました: ${storageError.message}`);
          return;
        }

        // 公開URLの取得
        const { data: publicUrlData } = supabase.storage
          .from("textbook")
          .getPublicUrl(storageData.path);

        if (publicUrlData?.publicUrl) {
          newImageUrl = publicUrlData.publicUrl;
        }
      }

      // 教科書情報を UPDATE
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

  // ---------------------------------------
  // 既存URLからストレージパスを取り出す関数
  // ---------------------------------------
  const extractBucketAndPathFromPublicUrl = (url: string) => {
    const bucket = "textbook";
    const idx = url.indexOf(bucket + "/");
    if (idx === -1) return { bucket: "", path: "" };
    const path = url.substring(idx + bucket.length + 1); // "textbook/" の後ろを取得
    return { bucket, path };
  };

  // ----------------
  // 画面レンダリング
  // ----------------
  return (
    <div>
      <h1>教科書の編集</h1>
      {!textbook ? (
        <p>データ読み込み中...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>タイトル:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label>著者:</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>
          <div>
            <label>科目:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label>学年:</label>
            <input
              type="number"
              value={grade ?? ""}
              onChange={(e) => setGrade(Number(e.target.value))}
            />
          </div>
          <div>
            <label>ISBN:</label>
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
            />
          </div>
          <div>
            <label>詳細:</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <div>
            <label>現在の画像:</label>
            {existingImageUrl ? (
              <img
                src={existingImageUrl}
                alt="Current"
                style={{ maxWidth: 200 }}
              />
            ) : (
              <p>画像なし</p>
            )}
          </div>
          <div>
            <label>画像を変更する:</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <button type="submit">更新する</button>
        </form>
      )}
    </div>
  );
}
