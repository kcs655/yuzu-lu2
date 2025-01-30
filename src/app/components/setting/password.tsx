"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { supabase } from '../../../../lib/supabase';

// メールアドレス表示コンポーネント
export const ShowEmail = () => {
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user?.email ?? '');
      }
    };

    fetchUser();
  }, []);

  return (
    <div>
      <h1>現在のメールアドレス</h1>
      <p>{email}</p>
    </div>
  );
};

// パスワード変更コンポーネント
export const ChangePassword = () => {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('パスワードを変更しました。');
        router.refresh();
        router.push("/mypage"); 
      }
    } catch (error) {
      setMessage('エラーが発生しました。');
    }
  };

  return (
    <div>
      <h1>パスワード変更</h1>
      <input
        type="password"
        placeholder="現在のパスワード"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="新しいパスワード"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={handleChangePassword}>変更</button>
      <p>{message}</p>
    </div>
  );
};