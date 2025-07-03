"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  
  // Automatically redirect to signin after a delay
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push("/signin");
    }, 5000);
    
    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Registration Restricted</h1>
        
        <div className="bg-amber-500/20 border border-amber-500 text-amber-200 px-4 py-3 rounded mb-6">
          <p className="mb-2">Registration is only available through administrators.</p>
          <p>Please contact your system administrator for access.</p>
        </div>
        
        <p className="text-gray-400 mb-6 text-center">
          You will be redirected to the sign-in page in a few seconds.
        </p>
        
        <div className="text-center">
          <Link href="/signin">
            <button className="bg-[#ffa500] hover:bg-[#ffb733] text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline">
              Go to Sign In
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 