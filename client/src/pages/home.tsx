import { useState } from "react";
import { Link } from "wouter";
import { Settings } from "lucide-react";

export default function Home() {
  const [phrase, setPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const getPhrase = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/frase");
      const text = await response.text();

      if (response.ok) {
        setPhrase(text);
        const remainingHeader = response.headers.get("X-RateLimit-Remaining");
        if (remainingHeader) {
          setRemaining(Number.parseInt(remainingHeader));
        }
      } else {
        alert(`Error: ${text}`);
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-white hover:text-blue-400 transition-colors">
                <i className="fas fa-home mr-2"></i>Inicio
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-300 hover:text-white transition-colors flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Administración
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center space-y-8 max-w-2xl mx-auto p-8">
          <h1 className="text-6xl md:text-8xl font-light text-white tracking-wide">Buen día</h1>

          <div className="w-24 h-px bg-gradient-to-r from-transparent via-white to-transparent mx-auto opacity-50"></div>

          <div className="space-y-4">
            <button
              onClick={getPhrase}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {loading ? "Obteniendo..." : "Obtener Frase"}
            </button>

            {phrase && (
              <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-white text-lg leading-relaxed">{phrase}</p>
              </div>
            )}

            {remaining !== null && (
              <p className="text-gray-400 text-sm">
                Requests restantes hoy: {remaining}/100
              </p>
            )}
          </div>

          <div className="text-gray-400 text-sm space-y-2">
            <p>API pública con límite de 100 requests por día</p>
            <p>
              Endpoint: <code className="bg-gray-800 px-2 py-1 rounded">GET /api/frase</code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
