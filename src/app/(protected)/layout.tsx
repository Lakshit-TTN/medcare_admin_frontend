"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setTimeout(() => router.push("/"), 2000);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/verify", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!data.valid) {
          setTimeout(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/");
          }, 3000);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {


        setTimeout(() => {
          router.push("/");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  if (loading) return <div>Loading...</div>;

  return isAuthenticated ? (
    <>
      {children}
    </>
  ) : null;
}
