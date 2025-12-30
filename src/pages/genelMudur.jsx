// pages/genelMudur.jsx
import { useRouter } from "next/router";

export default function GenelMudurPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Merhaba Genel Müdür</h1>
      <button
        onClick={handleLogout}
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
      >
        Çıkış Yap
      </button>
    </div>
  );
}
