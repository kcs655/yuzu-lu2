"use client";
import { useState, FormEvent } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from 'next/image';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(""); 
  
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(""); // ログイン試行時にエラーメッセージをリセット
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error(error.message);
        switch (error.message) {
          case "Invalid login credentials":
            setErrorMessage("メールアドレスまたはパスワードが間違っています。");
            break;
          case "Email not confirmed":
            setErrorMessage("メールアドレスが確認されていません。確認メールを確認してください。");
            break;
          default:
            setErrorMessage("ログインに失敗しました。"); 
        }
      } else {
        console.log("User logged in:");
        alert("ログイン成功");
        router.refresh();
        router.push("/mypage");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setErrorMessage("予期せぬエラーが発生しました。");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* ヘッダー */}
      <header style={{ 
        padding: '1rem', 
        background: '#f5f5f5', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* 左上にホームへ戻るリンク */}
        <div style={{ position: 'absolute', left: '1rem' }}>
        <Link href="/" style={{ cursor: 'pointer' }}>
          <Image
            src="/modoru.png" 
            alt="戻る"
            width={40} 
            height={40}
          />
        </Link>
      </div>
        <h1 style={{ margin: 0 }}>
          <Image
            src="/images/logo.png" 
            alt="Yuzu➡Lu"
            width={200} 
            height={200} 
          />
        </h1>
      </header>

      {/* メインコンテンツ */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ 
          border: '1px solid #ccc', 
          borderRadius: '8px', 
          padding: '2rem', 
          width: '320px', 
          background: '#fff' 
        }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            メールアドレス
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            パスワード
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>} {/* エラーメッセージを表示 */}
            <button type="submit" style={{ 
              padding: '0.5rem', 
              background: '#0070f3', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer' 
            }}>
              ログイン
            </button>
          </form>
        </div>
      </main>

      {/* フッター */}
      <footer style={{ padding: '1rem', background: '#f5f5f5', textAlign: 'center' }}>
        <p>
          アカウントをお持ちでない方は{" "}
          <Link 
            href="/signup" 
            style={{ color: '#0070f3', textDecoration: 'underline', cursor: 'pointer' }}>
            [ 新規登録 ]
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default Login;