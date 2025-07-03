"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { UploadButton } from "@/lib/uploadthing";
import { Trash2, Search } from "lucide-react";

//api key
const GEBETA_API_KEY = process.env.NEXT_PUBLIC_GEBETA_API_KEY || "";

type GeocodingResult = {
  name: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  type?: string;
  City?: string;
  Country?: string;
};

export default function AddPlacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  //state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [openHours, setOpenHours] = useState("");
  const [openDays, setOpenDays] = useState("");
  
  //geocoding states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    setError("");
    setShowResults(false);
    
    try {
      const response = await fetch(
        `https://mapapi.gebeta.app/api/v1/route/geocoding?name=${encodeURIComponent(searchQuery)}&apiKey=${GEBETA_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to get location data");
      }
      
      const data = await response.json();
      console.log("api response:", data); 
      
      if (data.msg === "ok" && Array.isArray(data.data) && data.data.length > 0) {
        //mappig response
        const mappedResults = data.data.map((item: any) => ({
          name: item.name,
          lat: item.lat || item.latitude,
          lng: item.lng || item.longitude,
          city: item.city || item.City,
          country: item.country || item.Country,
          type: item.type
        }));
        
        //validating
        const validResults = mappedResults.filter(
          (item: { lat: any; lng: any; }) => item && (typeof item.lat === 'number' || typeof item.lng === 'number')
        );
        
        if (validResults.length > 0) {
          setSearchResults(validResults);
          setShowResults(true);
        } else {
          setSearchResults([]);
          setError("No valid location data found");
        }
      } else {
        setSearchResults([]);
        setError("No locations found");
      }
    } catch (err: any) {
      console.error("Search error:", err); 
      setError(err.message || "Error searching for location");
    } finally {
      setSearchLoading(false);
    }
  };

  const selectLocation = (location: GeocodingResult) => {
    console.log("Selected location:", location);
    
    const lat = location.lat || location.latitude;
    const lng = location.lng || location.longitude;
    
    if (location && typeof lat === 'number' && typeof lng === 'number') {
      setLatitude(lat.toString());
      setLongitude(lng.toString());
      //also setting name
      if (location.name) {
        setName(location.name);
      }
      setShowResults(false);
      //clearing
      setError("");
    } else {
      console.error("Invalid location data:", location);
      setError("Invalid location. do it manually.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      //default img
      const finalImageUrls = imageUrls.length > 0 ? imageUrls : ["/assets/placeholder.jpg"];
      
      //response
      const response = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          images: finalImageUrls,
          openHours,
          openDays,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add place");
      }

      setSuccess(true);
      // Reset form
      setName("");
      setPhone("");
      setLongitude("");
      setLatitude("");
      setImageUrls([]);
      setOpenHours("");
      setOpenDays("");
      setSearchQuery("");
      setSearchResults([]);
      
      //redirect if delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageUrls(imageUrls.filter((_, index) => index !== indexToRemove));
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
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Add New Laptop-Friendly Place</h1>
          <Link 
            href="/dashboard"
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded mb-6">
            Place added successfully! Redirecting to dashboard...
          </div>
        )}

        <div className="bg-zinc-900 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* geocoding*/}
            <div className="bg-zinc-800 p-4 rounded-md border border-zinc-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search for a Place
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search for a place"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="bg-stone-900 hover:bg-stone-950 text-white px-4 py-2 rounded-md flex items-center justify-center"
                >
                  {searchLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <Search size={18} />
                  )}
                </button>
              </div>
              
              {showResults && searchResults.length > 0 && (
                <div className="mt-3 bg-zinc-700 rounded-md max-h-60 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectLocation(result)}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-600 border-b border-zinc-600 last:border-0"
                    >
                      <div className="font-medium">{result.name}</div>
                      <div className="text-xs text-gray-300">
                        {(result.city || result.city) && (result.country || result.Country) ? 
                          `${result.city || result.City}, ${result.country || result.Country}` : ''}
                        {result.type ? ` - ${result.type}` : ''}
                      </div>
                      <div className="text-xs text-gray-400">
                        {/* Lat:{result.latitude}, Lng: {result.longitude} */}
                        Lat: {result.lat || result.latitude}, Lng: {result.lng || result.longitude}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Place Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="openHours" className="block text-sm font-medium text-gray-300 mb-1">
                Open Hours
              </label>
              <input
                id="openHours"
                type="text"
                placeholder="e.g. 9:00 AM - 5:00 PM"
                value={openHours}
                onChange={(e) => setOpenHours(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
              />
            </div>

            <div>
              <label htmlFor="openDays" className="block text-sm font-medium text-gray-300 mb-1">
                Open Days
              </label>
              <input
                id="openDays"
                type="text"
                placeholder="e.g. Monday - Friday"
                value={openDays}
                onChange={(e) => setOpenDays(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Images
              </label>
              <div className="flex flex-col items-center space-y-4">
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 w-full mb-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative bg-zinc-800 rounded-md overflow-hidden h-40">
                        <Image 
                          src={url}
                          alt={`Image ${index + 1}`}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-black bg-opacity-50 p-1 rounded-full hover:bg-red-800"
                          title="Remove image"
                        >
                          <Trash2 size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                      // Get the URL from the uploaded file
                      const uploadedFile = res[0];
                      if (uploadedFile && uploadedFile.url) {
                        // Add the new URL to the existing array
                        setImageUrls([...imageUrls, uploadedFile.url]);
                        console.log("Image uploaded:", uploadedFile.url);
                      }
                    }
                  }}
                  onUploadError={(error: Error) => {
                    setError(`Error uploading: ${error.message}`);
                  }}
                />
                
                <p className="text-xs text-gray-400">
                  {imageUrls.length > 0 
                    ? `${imageUrls.length} image(s) uploaded` 
                    : "No images selected. A default image will be used."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-300 mb-1">
                  Longitude
                </label>
                <input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-300 mb-1">
                  Latitude
                </label>
                <input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ffa500] hover:bg-[#ffb733] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? "Adding Place..." : "Add Place"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 