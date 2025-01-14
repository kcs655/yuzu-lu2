"use client";
import { FC, memo, ReactNode, useState } from "react";
import Link from "next/link";

import styles from "./Layout.module.css";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import * as JSX from 'react';

import { favoriteImage, chatImage, UploadedImage } from "../../../styles/icon";


type Props = {
  children: ReactNode;
};

type Navigation = {
  pageName: string;
  path: string;
  icon: ReactNode; // iconの型をStaticImageDataに変更
};

const navigations: Navigation[] = [
  {
    pageName: "マイページ",
    path: "/mypage",
    icon: <UploadedImage className={styles.icon} altText="Uploaded Image" />, // 画像を指定
  },
  {
    pageName: "教科書検索",
    path: "/search",
    icon: <UploadedImage className={styles.icon} altText="Uploaded Image" />, // 画像を指定
  },
  {
    pageName: "教科書登録",
    path: "/register-textbook",
    icon: <UploadedImage className={styles.icon} altText="Uploaded Image" />, // 画像を指定
  },
  {
    pageName: "欲しい教科書",
    path: "/wish-list",
    icon: <UploadedImage className={styles.icon} altText="Uploaded Image" />, // 画像を指定
  },
  {
    pageName: "チャット",
    path: "/chats",
    icon: <UploadedImage className={styles.icon} altText="Uploaded Image" />, // 画像を指定
  },
  {
    pageName: "設定",
    path: "/settings",
    icon: <UploadedImage className={styles.icon} altText="Uploaded Image" />, // 画像を指定
  },
];

/* eslint-disable-next-line react/display-name */
export const Layout: FC<Props> = memo((props) => {
  const { children } = props;
  const [menuOpen, setMenuOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const isPageActive = (pagePath: string): boolean => {
    return pagePath === pathname;
  };

  // ここでLogoutのロジックを組み込み
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
    <div className={styles.root}>
      <aside
        className={styles.sidebar}
        style={{ width: menuOpen ? "200px" : "60px" }}
      >
        <div
          className={styles.hamburger}
          role="button"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {[...Array(3)].map((_, index: number) => (
            <span
              className={
                menuOpen ? styles.menuCloseArrow : styles.menuOpenArrow
              }
              key={index}
            ></span>
          ))}
        </div>
        {navigations.map((navigation) => (
          <Link href={navigation.path} key={navigation.pageName} legacyBehavior>
            <a
              className={styles.flexContainer}
              style={{
                background: isPageActive(navigation.path) ? "#1B555A" : "none",
              }}
            >

              {menuOpen && (
                <p className={styles.pageName}>{navigation.pageName}</p>
              )}
            </a>
          </Link>
        ))}

        {/* ログアウトボタン */}
        <div
          className={styles.flexContainer}
          style={{ cursor: "pointer", marginTop: "auto", padding: "1rem" }}
          onClick={() => setShowLogoutConfirm(true)}
        >
          {menuOpen && <p className={styles.pageName}>ログアウト</p>}
        </div>
      </aside>

      <main className={styles.mainContent}>
        {children}

        {/* ログアウト確認ダイアログ */}
        {showLogoutConfirm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: "2rem",
                borderRadius: "8px",
                textAlign: "center",
                width: "300px",
              }}
            >
              <p>ログアウトしますか？</p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "1rem",
                }}
              >
                <button
                  onClick={() => {
                    handleLogout();
                    setShowLogoutConfirm(false);
                  }}
                  style={{
                    background: "#0070f3",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                  }}
                >
                  はい
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    background: "#ccc",
                    color: "#000",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                  }}
                >
                  いいえ
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
});

export default Layout;
