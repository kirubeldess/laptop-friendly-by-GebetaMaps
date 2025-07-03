import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl mb-6">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          No page found!
        </p>
        <Link 
          href="/" 
          className="bg-[#ffa500] hover:bg-[#ffb733] text-white font-bold py-2 px-6 rounded-md"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
} 