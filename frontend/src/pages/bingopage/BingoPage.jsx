import React from "react";
import { useAuth } from "../../context/AuthContext";
import Bingo from "../../components/bingo/Bingo";

const BingoPage = () => {
  const { user, loading, token } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "20px",
      }}
    >
      <h2>Bingo Page</h2>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#1e293b",
          borderRadius: "10px",
        }}
      >
        <p>
          <strong>Loading:</strong> {String(loading)}
        </p>

        <p>
          <strong>User:</strong>{" "}
          {user ? JSON.stringify(user) : "NULL"}
        </p>

        <p>
          <strong>Token:</strong>{" "}
          {token ? "EXISTS" : "NULL"}
        </p>
      </div>

      {user ? (
        <Bingo theme="green" />
      ) : (
        <div style={{ marginTop: "30px" }}>
          Waiting for authentication...
        </div>
      )}
    </div>
  );
};

export default BingoPage;