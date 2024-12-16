"use client";

export default function Home() {
  const handleTermsClick = () => {
    alert("利用規約を確認してください。");
  };

  return (
    <div style={styles.container}>
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
        <button style={styles.button} onClick={handleTermsClick}>
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
