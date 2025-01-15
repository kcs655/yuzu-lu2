"use client";


export default function Home() {
  const handleTermsClick = () => {
    alert("利用規約を確認してください。");
  };

  return (
    <div style={styles.container}>
      
      <div style={styles.logoWrapper}>
      {/* アイコン画像 */}
      <img
        src="images/logo.png" // アップロードされたアイコンのURLに置き換えてください
        alt="Yuzu=Lu アイコン"
        style={{
          maxWidth: "400px",      // 画面幅の80%まで拡大
          maxHeight: "400px",     // 画面高の80%まで拡大
          height: "auto",        // アスペクト比を保つ
          marginBottom: "20px",
          borderRadius: "10px",
          objectFit: "cover",    // 画像が枠に収まるよう必要に応じて変更
        }}
      />
</div>
      {/* ボタン */}
      <div style={styles.buttonContainer}>
        <button
          style={styles.button}
          onClick={() => (window.location.href = "/login")}
        >
          ログイン
        </button>
        <button
          style={styles.button}
          onClick={() => (window.location.href = "/signup")}
        >
          新規登録
        </button>
        <button style={styles.button} onClick={() => window.location.href = '/terms-of-service.html'}>
          利用規約
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f8ff",
    // ★ 背景画像を指定する
    backgroundImage: 'url("/images/haikei01.png")', // ここを実際の背景画像パスに
    backgroundSize: "cover",      // 画像を画面全体に埋める
    backgroundPosition: "center", // 中央寄せ
    backgroundRepeat: "no-repeat",// 繰り返しなし
    // ★ 背景の明るさを上げる
    filter: "brightness(1.0)", 
  },
  logoWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.70)", 
    padding: "20px",
    borderRadius: "10px",
    /* 影で強調したい場合 */
    boxShadow: "0 4px 8px rgba(31, 28, 28, 0.2)",
  },
 
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  button: {
    width: "150px",
    padding: "10px",
    backgroundColor: "#007BFF",
    color: "white",
    fontSize: "16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    textAlign: "center",
  },
};
