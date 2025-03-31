"use client"
import React, { useEffect, useState } from "react";
import styles from "../../app/styles/login.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Toast from "../../components/toast/Toast"

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    const checkToken = async () => {
      const storedToken = localStorage.getItem("token");
      
      if (!storedToken) return;
  
      const res = await fetch("http://localhost:5000/api/auth/verify", {
        method: "POST",
        headers: { Authorization: `Bearer ${storedToken}` },
      });
  
      const data = await res.json();
  
      if (!data.valid) {
        showToast("Session expired. Please log in again.", "error");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        showToast("Already Logged In", "info");
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      }
    };
  
    checkToken();
  }, []);
  
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await res.json();
      console.log("Login Response:", data);
  
      if (!res.ok) {
        showToast("Login failed", "error");
        return;
      }
  
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
  
        showToast("Logging in as Admin", "success");
  
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        showToast("Invalid response from server", "error");
      }
    } catch (err) {
      console.error("Login Error:", err);
      showToast("Network error. Try again later.", "error");
    }
  };
  
  

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);


  return hydrated ? (
    <div className={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className={styles.card}>

        <h2>Admin Login</h2>
        <p>
          Login with your admin credentials{" "}
        </p>

        <form className={styles.form} onSubmit={handleLogin}>

          <label className={styles.label}>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className={styles.label}>Password</label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className={styles.inputP}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              <Image
                src={"/Eye.svg"}
                alt="Toggle Password"
                width={15}
                height={15}
              />
            </button>
          </div>

          <button type="submit" className={styles.loginButton}>
            Login
          </button>

          <button type="button" className={styles.resetButton} onClick={() => { setEmail(""); setPassword(""); }}>
            Reset
          </button>
        </form>
      </div>
    </div>
  ) : <div>Loading...</div>;
};

export default Login;
