"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import { useRouter } from "next/navigation";
import Email from "@/app/components/settings/Email";

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
      const { data: userData, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user data:", error);
        router.push("/mypage");
        return;
      }

      if (!userData?.user || !userData.user.email) {
        console.error("No user or email found");
        router.push("/mypage");
        return;
      }

      setUser({
        id: userData.user.id,
        email: userData.user.email,
      });
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Error loading user data</div>;
  }

  return <Email email={user.email} />;
};

export default EmailPage;
