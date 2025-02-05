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
        src="images/logo01.png" 
        alt="Yuzu=Lu アイコン"
        style={{
          maxWidth: "400px",      
          maxHeight: "400px",     
          height: "auto",        
          marginBottom: "20px",
          borderRadius: "10px",
          objectFit: "cover",    
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
    //  背景画像を指定する
    backgroundImage: 'url("/images/haikei01.png")', 
    backgroundSize: "cover",      
    backgroundPosition: "center", 
    backgroundRepeat: "no-repeat",
    //  背景の明るさを上げる
    filter: "brightness(1.0)", 
  },
  logoWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.70)", 
    padding: "25px",
    borderRadius: "10px",
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
