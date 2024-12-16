"use client";
import { FC, memo, ReactNode, useState } from "react";
import Link from "next/link";
import styles from "./Layout.module.css";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
};

type Navigation = {
  pageName: string;
  path: string;
};

const navigations: Navigation[] = [
  {
    pageName: "マイページ",
    path: "/mypage",
  },
  {
    pageName: "教科書検索",
    path: "/search",
  },
  {
    pageName: "教科書登録",
    path: "/register-textbook",
  },
  {
    pageName: "設定",
    path: "/settings",
  },
];

/* eslint-disable-next-line react/display-name */
export const Layout: FC<Props> = memo((props) => {
  const { children } = props;

  const [menuOpen, setMenuOpen] = useState(true);

  const Pathname = usePathname();

  const isPageActive = (pagePath: string): boolean => {
    return pagePath === Pathname;
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
      </aside>

      <main className={styles.mainContent}>{children}</main>
    </div>
  );
});
export default Layout;
