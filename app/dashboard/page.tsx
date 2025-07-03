"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({});

  useEffect(() => {
    //redirect if not authorized
    if (status === "unauthenticated") {
      router.push("/signin");
    }

    //fetching places
    if (status === "authenticated") {
      fetchPlaces();
    }
  }, [status, router]);

  const fetchPlaces = async () => {
    try {
      const response = await fetch("/api/places");
      const data = await response.json();
      if (data.success) {
        setPlaces(data.places);
        // Initialize image indexes
        const indexes: Record<string, number> = {};
        data.places.forEach((place: any) => {
          indexes[place._id] = 0;
        });
        setCurrentImageIndexes(indexes);
      }
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete place?")) {
      try {
        setDeleting(id);
        const response = await fetch(`/api/places/${id}`, {
          method: "DELETE",
        });
        
        if (response.ok) {
          //removing the deleted ones
          setPlaces(places.filter((place: any) => place._id !== id));
        } else {
          console.error("Failed to delete place");
        }
      } catch (error) {
        console.error("Error deleting place:", error);
      } finally {
        setDeleting(null);
      }
    }
  };

  const handlePrevImage = (id: string, imagesLength: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [id]: (prev[id] - 1 + imagesLength) % imagesLength
    }));
  };

  const handleNextImage = (id: string, imagesLength: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [id]: (prev[id] + 1) % imagesLength
    }));
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <p className="hidden sm:block">Welcome, {session?.user?.name || session?.user?.email}</p>
            <button
              onClick={handleSignOut}
              className="bg-zinc-900 hover:bg-zinc-700 text-white px-4 py-2 rounded-md"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="mb-6">
          <Link
            href="/add-place"
            className="inline-block bg-[#ffa500] hover:bg-[#ffb733] text-white font-bold py-2 px-6 rounded-md"
          >
            Add New Place
          </Link>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Laptop Friendly Places</h2>
          
          {loading ? (
            <p>Loading places...</p>
          ) : places.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {places.map((place: any) => {
                const images = Array.isArray(place.images) ? place.images : [place.image || "/assets/placeholder.jpg"];
                const currentIndex = currentImageIndexes[place._id] || 0;
                
                return (
                  <div key={place._id} className="bg-zinc-800 p-4 rounded-md overflow-hidden relative">
                    <div className="relative w-full h-40 mb-3 bg-zinc-700 rounded-md overflow-hidden">
                      <Image
                        src={images[currentIndex] || "/assets/placeholder.jpg"}
                        alt={place.name}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      
                      {images.length > 1 && (
                        <>
                          <button 
                            onClick={() => handlePrevImage(place._id, images.length)}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-1 rounded-full hover:bg-opacity-70"
                            aria-label="Previous image"
                          >
                            <ChevronLeft size={20} className="text-white" />
                          </button>
                          <button 
                            onClick={() => handleNextImage(place._id, images.length)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-1 rounded-full hover:bg-opacity-70"
                            aria-label="Next image"
                          >
                            <ChevronRight size={20} className="text-white" />
                          </button>
                          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                            {images.map((_: any, idx: number) => (
                              <div 
                                key={idx} 
                                className={`h-1.5 w-1.5 rounded-full mx-0.5 ${idx === currentIndex ? 'bg-white' : 'bg-gray-400'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <h3 className="font-medium text-lg">{place.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">Phone: {place.phone}</p>
                    <div className="mt-1 text-sm text-gray-400">
                      <p>Hours: {place.openHours || "Not Known"}</p>
                      <p>Days: {place.openDays || "Not Known"}</p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                      <div>
                        <span>Longitude: {place.longitude}</span>
                        <span className="ml-2">Latitude: {place.latitude}</span>
                      </div>
                      <button 
                        onClick={() => handleDelete(place._id)}
                        disabled={deleting === place._id}
                        className="p-1 rounded-full hover:bg-red-800 transition-colors"
                        title="Delete place"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No places found.</p>
          )}
        </div>
      </div>
    </div>
  );
} 