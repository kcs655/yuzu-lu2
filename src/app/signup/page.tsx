"use client";

import { useState, FormEvent } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error(error.message);
    } else {
      console.log("User signed up:", data);
      alert("登録しました");
      router.refresh();
      router.push("/");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* ヘッダー */}
      <header style={{ padding: '1rem', background: '#f5f5f5', textAlign: 'center' }}>
        <h1>Yuzu➡Lu</h1>
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
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <button 
              type="submit" 
              style={{ 
                padding: '0.5rem', 
                background: '#0070f3', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer' 
              }}
            >
              新規登録
            </button>
          </form>
        </div>
      </main>

      {/* フッター */}
      <footer style={{ padding: '1rem', background: '#f5f5f5', textAlign: 'center' }}>
        <p>
          アカウントをお持ちの方は{" "}
          <Link 
            href="/login" 
            style={{ color: '#0070f3', textDecoration: 'underline', cursor: 'pointer' }}
          >
           [ ログイン ]
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default SignUp;
