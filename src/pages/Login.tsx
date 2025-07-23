import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/auth"; // Backend adresinize göre güncelleyin

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const endpoint = isRegister ? "/register" : "/login";
      const res = await fetch(API_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Bir hata oluştu");
      } else {
        if (isRegister) {
          setSuccess("Kayıt başarılı! Admin onayı bekleniyor.");
        } else {
          // Giriş başarılı, token'ı kaydet
          localStorage.setItem("token", data.token);
          setSuccess("Giriş başarılı!");
          window.location.href = "/";
        }
      }
    } catch (err) {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#18192a] to-[#23243a]">
      <div className="bg-[#23243a] p-8 rounded-xl shadow-lg w-full max-w-sm border border-[#2d2e4a]">
        <h2 className="text-2xl font-bold text-blue-200 mb-6 text-center">
          {isRegister ? "Kayıt Ol" : "Giriş Yap"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-blue-100 mb-1">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg bg-[#20213a] border border-[#2d2e4a] text-white focus:outline-none focus:border-blue-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-blue-100 mb-1">Şifre</label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg bg-[#20213a] border border-[#2d2e4a] text-white focus:outline-none focus:border-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}
          {success && (
            <div className="text-green-400 text-sm text-center">{success}</div>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white font-semibold py-2 rounded-lg shadow transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "İşleniyor..." : isRegister ? "Kayıt Ol" : "Giriş Yap"}
          </button>
        </form>
        <div className="mt-4 text-center space-y-2">
          <button
            className="text-blue-300 hover:underline text-sm block"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setSuccess(null);
            }}
          >
            {isRegister
              ? "Zaten hesabın var mı? Giriş Yap"
              : "Hesabın yok mu? Kayıt Ol"}
          </button>
          <button
            className="text-gray-400 hover:text-gray-300 text-xs block"
            onClick={() => navigate("/admin-login")}
          >
            Admin Girişi
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
