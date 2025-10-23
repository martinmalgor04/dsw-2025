import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Sistema de Gestión Logística
        </h1>
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md text-center hover:bg-blue-700 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/analitica"
            className="block w-full bg-green-600 text-white py-2 px-4 rounded-md text-center hover:bg-green-700 transition-colors"
          >
            Analítica
          </Link>
          <Link
            href="/configuration"
            className="block w-full bg-purple-600 text-white py-2 px-4 rounded-md text-center hover:bg-purple-700 transition-colors"
          >
            Configuración
          </Link>
        </div>
      </div>
    </div>
  );
}
