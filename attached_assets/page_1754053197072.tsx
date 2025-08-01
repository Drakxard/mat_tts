"use client"

import { useState } from "react"

export default function Home() {
  const [phrase, setPhrase] = useState("")
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)

  const getPhrase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/frase")
      const text = await response.text()

      if (response.ok) {
        setPhrase(text)
        const remainingHeader = response.headers.get("X-RateLimit-Remaining")
        if (remainingHeader) {
          setRemaining(Number.parseInt(remainingHeader))
        }
      } else {
        alert(`Error: ${text}`)
      }
    } catch (error) {
      alert("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
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

          {remaining !== null && <p className="text-gray-400 text-sm">Requests restantes hoy: {remaining}/100</p>}
        </div>

        <div className="text-gray-400 text-sm space-y-2">
          <p>API pública con límite de 100 requests por día</p>
          <p>
            Endpoint: <code className="bg-gray-800 px-2 py-1 rounded">GET /api/frase</code>
          </p>
        </div>
      </div>
    </main>
  )
}
