"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import { useRouter } from "next/navigation";
import EmailForm from "@/app/components/settings/Email"; // Emailコンポーネントの名前をEmailFormに変更

interface User {
  id: string;
  email: string;
}

const EmailPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error fetching session:", sessionError);
        router.push("/mypage");
        return;
      }

      if (!sessionData.session?.user || !sessionData.session.user.email) {
        console.error("No user or email found");
        router.push("/mypage");
        return;
      }

      setUser({
        id: sessionData.session.user.id,
        email: sessionData.session.user.email,
      });
      setLoading(false);

      // セッションの有効期限を確認
      console.log("Session expires at:", sessionData.session?.expires_at);
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Error loading user data</div>;
  }

  return <EmailForm email={user.email} />; // EmailコンポーネントをEmailFormに変更
};

export default EmailPage;
