import React from "react";
import { useAuth } from "../../context/AuthContext";
import Bingo from "../../components/bingo/Bingo";

const BingoPage = () => {
  const { user, loading } = useAuth();

  /*
   * Authentication is handled by LoginPage/AuthContext.
   * BingoPage should NOT authenticate Telegram again.
   */

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          background: "#020617",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <div style={{ fontSize: "50px" }}>🎮</div>

        <h2
          style={{
            margin: 0,
            fontSize: "24px",
          }}
        >
          Loading Bingo...
        </h2>
      </div>
    );
  }

  /*
   * If there is no authenticated user,
   * don't render the game.
   */
  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          background: "#020617",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            fontSize: "50px",
            marginBottom: "20px",
          }}
        >
          🔐
        </div>

        <h2
          style={{
            marginBottom: "10px",
          }}
        >
          Please Login
        </h2>

        <p
          style={{
            color: "#94a3b8",
          }}
        >
          Your Telegram session could not be found.
        </p>
      </div>
    );
  }

  /*
   * User authenticated → show Bingo.
   */
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
      }}
    >
      <Bingo theme="green" />
    </div>
  );
};

export default BingoPage;
