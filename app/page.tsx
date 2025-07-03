import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden ">
      {/* the grid */}
      <div
        className={cn(
          "absolute inset-0 z-0",
          "[background-size:20px_20px]",
          "[background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
        )}
      />
      {/* fade */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full max-w-5xl px-6 py-16 gap-12">
        {/* left*/}
        <div className="flex-1 flex flex-col items-start justify-center text-left">
          <h1 className="text-3xl md:text-4xl space-x-0.5 space-y-1 font-bold text-white mb-4">
            struggling to find laptop-friendly places? <br /> we got you covered.
          </h1>
          <p className="text-white text-sm mb-8 opacity-70">powered by GebetaMaps</p>
          <Link href="/explore">
            <Button
              className="bg-[#ffa500] text-white px-8 py-3 text-lg font-semibold shadow-lg hover:bg-[#ffb733] transition-colors"
              size="lg"
            >
              Get Started
            </Button>
          </Link>
        </div>
        {/* right*/}
        <div className="flex-1 flex items-center justify-center">
          <Image
            src="/assets/homepage-img.png"
            alt="Laptop friendly place illustration"
            width={480}
            height={480}
            className="w-full max-w-xs md:max-w-md h-auto object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
