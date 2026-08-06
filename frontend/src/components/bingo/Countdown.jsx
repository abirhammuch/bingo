import React, { useEffect, useState } from "react";

const Countdown = ({ seconds = 30 }) => {
  const [t, setT] = useState(seconds);
  useEffect(() => {
    setT(seconds);
  }, [seconds]);
  useEffect(() => {
    const id = setInterval(() => setT((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return <div className="text-sm text-slate-300">{t}s</div>;
};

export default Countdown;
