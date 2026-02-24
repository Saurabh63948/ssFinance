
export default  function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <h1 className="text-4xl font-bold text-blue-900">Vitta-Lekha</h1>
      <p className="mt-4 text-gray-600 text-lg">Digital Daily Collection & Finance Manager</p>
      <div className="mt-8 flex gap-4">
        <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
          Get Started
        </a>
      </div>
    </main>
  );
}