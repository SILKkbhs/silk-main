'use client';
import React, { useEffect, useState } from "react";
import TabBar from "@/components/TabBar";
import Feed from "@/components/Feed";
import Write from "@/components/Write";
import Explore from "@/components/Explore";
import Login from "@/components/Login";
import SignUp from "@/components/Signup";
import { auth } from "@/components/Firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

type Tab = "feed" | "write" | "explore" | "login" | "signup"

export default function Page() {
  const [tab, setTab] = useState<Tab>("feed");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 해시 기반 탭
  useEffect(() => {
    const initial = (location.hash.replace("#", "") || "feed") as Tab;
    setTab(initial);
    const onHash = () => {
      const next = (location.hash.replace("#", "") || "feed") as Tab;
      setTab(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Firebase 로그인 상태 구독
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserEmail(user.email);
      else setUserEmail(null);
    });
    return () => unsubscribe();
  }, []);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("로그아웃되었습니다.");
    } catch (err: any) {
      console.error(err);
      alert("로그아웃 실패: " + err.message);
    }
  };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
      {/* TabBar와 오른쪽 상단 이메일 + 로그아웃 버튼 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <TabBar current={tab} />
        {userEmail && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 500, color: "#333" }}>{userEmail}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: "4px 8px",
                background: "#f87171", // 빨강색
                color: "#fff",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
                fontSize: 12
              }}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>

      {/* 페이지 내용 */}
      {tab === "feed" && <Feed />}
      {tab === "write" && <Write />}
      {tab === "explore" && <Explore />}
      {tab === "login" && <Login />}
      {tab === "signup" && <SignUp />}
    </main>
  );
}
