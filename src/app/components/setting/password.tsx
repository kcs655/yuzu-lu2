"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

// メールアドレス表示
export const ShowEmail = () => {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setEmail(user?.email ?? "");
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        現在のメールアドレス
      </h2>
      <p className="text-gray-600 px-4 py-2 bg-gray-50 rounded-md">
        {email || "読み込み中..."}
      </p>
    </div>
  );
};

// パスワード変更
export const ChangePassword = () => {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 確認用パスワード追加
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChangePassword = async () => {
    // 新しいパスワードと確認用パスワードが一致するかチェック
    if (newPassword !== confirmPassword) {
      setMessage("新しいパスワードと確認用パスワードが一致しません。");
      setIsSuccess(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage("パスワードを変更しました。");
        setIsSuccess(true);
        setOldPassword(""); 
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          router.refresh();
          router.push("/mypage");
        }, 2000);
      }
    } catch (error) {
      setMessage("エラーが発生しました。");
      setIsSuccess(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        パスワード変更
      </h2>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            現在のパスワード
          </label>
          <input
            id="currentPassword"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-colors"
            placeholder="現在のパスワードを入力"
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            新しいパスワード
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-colors"
            placeholder="新しいパスワードを入力"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            新しいパスワード（確認用）
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-colors"
            placeholder="新しいパスワードを再入力"
          />
        </div>

        <button
          onClick={handleChangePassword}
          className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!oldPassword || !newPassword || !confirmPassword}
        >
          変更する
        </button>

        {message && (
          <div
            className={`mt-4 p-4 rounded-md ${
              isSuccess
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
