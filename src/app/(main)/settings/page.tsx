"use client";

import { supabase } from "../../../../lib/supabase";
import { useRouter } from "next/navigation";

const Logout = () => {
  const router = useRouter();
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error.message);
    } else {
      console.log("User logged out");
      alert("ログアウトしました。");
      router.refresh();
      router.push("/");
    }
  };

  return (
    <header>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
};
const settings = () => {
  return (
    <div>
      <h1>設定</h1>
      <p>メールアドレスやパスワードを変更するところです（理想）</p>
      <Logout /> {/* ログアウトコンポーネントを追加 */}
    </div>
  );
};

export default settings;
