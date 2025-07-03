"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, ChevronLeft, ChevronRight, Navigation, X } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";

//importing dycnamic for ssr issues
const GebetaMap = dynamic(
  () => import("@gebeta/tiles").then(mod => mod.GebetaMap),
  { ssr: false }
);

const MapMarker = dynamic(
  () => import("@gebeta/tiles").then(mod => mod.MapMarker),
  { ssr: false }
);

const MapPolyline = dynamic(
  () => import("@gebeta/tiles").then(mod => mod.MapPolyline),
  { ssr: false }
);

//api key
const GEBETA_API_KEY = process.env.NEXT_PUBLIC_GEBETA_API_KEY || "";

//place for ts
type Place = {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  phone: string;
  images: string[];
  openHours?: string;
  openDays?: string;
};

//ts for dirn
type Direction = {
  msg: string;
  timetaken: number;
  totalDistance: number;
  direction: [number, number][];
};

//testing
const TEST_ROUTE: [number, number][] = [
  [9.0013, 38.7614],
  [8.9980, 38.7600],
  [8.9950, 38.7590],
  [8.9922, 38.7587]
];

export default function ExplorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([38.7578, 8.9806]); // Default to Addis Ababa
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  //locn and dirn 
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; time: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    //location getting
    getUserLocation();
    
    const fetchPlaces = async () => {
      try {
        const response = await fetch("/api/places");
        const data = await response.json();
        
        if (data.success && data.places.length > 0) {
          setPlaces(data.places);
          
          //centering map on place
          if (data.places.length > 0) {
            const firstPlace = data.places[0];
            setMapCenter([firstPlace.longitude, firstPlace.latitude] as [number, number]);
          }
        }
      } catch (error) {
        console.error("Error fetching places:", error);
      } finally {
        setLoading(false);
        //1 sec delay
        setTimeout(() => setMapLoaded(true), 1000);
      }
    };

    fetchPlaces();
  }, []);

  useEffect(() => {
    //i'll delete it after it works
    if (routeCoordinates.length > 0) {
      console.log("Route coordinates set in state:", routeCoordinates);
      console.log("First coordinate:", routeCoordinates[0]);
      console.log("Last coordinate:", routeCoordinates[routeCoordinates.length - 1]);
      console.log("MapPolyline will render with these coordinates");
    }
  }, [routeCoordinates]);

  //current loc
  const getUserLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    
    if (navigator.geolocation) {
      // clear previous cached locs
      try {
        navigator.geolocation.clearWatch(navigator.geolocation.watchPosition(() => {}));
      } catch (e) {
        
      }
      
      //hign acc
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude, accuracy } = position.coords;
          
          setUserLocation([longitude, latitude] as [number, number]);
          setIsLocating(false);
        },
        (highAccuracyError) => {
          console.warn("location failed:", highAccuracyError);
          
          //low acc just in case
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { longitude, latitude, accuracy } = position.coords;
              console.log(`Location acquired with lower accuracy: ${accuracy} meters`);
              setUserLocation([longitude, latitude] as [number, number]);
              setIsLocating(false);
            },
            (error) => {
              console.error("geolocation error:", error);
              
              //erroring
              if (error.code) {
                
                  setLocationError("unable to access your location :( ");
              } 
              setIsLocating(false);
            },
            { 
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 0
            }
          );
        },
        { 
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError("geolocation not supported.");
      setIsLocating(false);
    }
  };


  const getDirections = async (place: Place) => {
    if (!userLocation) {
      setLocationError("Your location is required to show directions. Please allow location access.");
      return;
    }
    
    setRouteLoading(true);
    setRouteCoordinates([]);
    setRouteInfo(null);
    
    try {
      //formatting lat and lng
      const origin = `${userLocation[1]},${userLocation[0]}`;
      const destination = `${place.latitude},${place.longitude}`;
      
      console.log("Fetching route from:", origin, "to:", destination);
      
    
      const url = `https://mapapi.gebeta.app/api/route/direction/?origin=${origin}&destination=${destination}&apiKey=${GEBETA_API_KEY}`;
      console.log("API URL:", url); //i'll delete later
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to get directions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("dirn api response:", data);
      
      if (data.msg === "Ok" && data.direction && Array.isArray(data.direction) && data.direction.length > 0) {
        console.log(`Route received with ${data.direction.length} points`);
        
        
        const validDirections = data.direction
          .filter((point: any) => 
            Array.isArray(point) && point.length === 2 && 
            !isNaN(point[0]) && !isNaN(point[1])
          )
          .map((point: [number, number]) => [point[1], point[0]]); // Swap lat/lng to lng/lat
        
        console.log("Converted route points:", validDirections);
        
        if (validDirections.length < 2) {
          setLocationError("Not enough valid points in route data");
          console.error("Invalid route points:", data.direction);
          setRouteLoading(false);
          return;
        }
        
        //storing valid dirn ins state
        setRouteCoordinates(validDirections);
        setRouteInfo({
          distance: data.totalDistance / 1000, // km converting
          time: data.timetaken / 60 // min converting
        });
      } else {
        throw new Error("no route found");
      }
    } catch (error) {
      console.error("direction error:", error);
      setLocationError("could not find a route to this location.");
    } finally {
      setRouteLoading(false);
    }
  };

  //clearing currrent state
  const clearRoute = () => {
    setRouteCoordinates([]);
    setRouteInfo(null);
  };

  const handleMarkerClick = (id: string) => {
    const place = places.find(p => p._id === id);
    if (place) {
      setSelectedPlace(place);
      setCurrentImageIndex(0); //resetting
      setMapCenter([place.longitude, place.latitude] as [number, number]);
      
  
      if (userLocation) {
        getDirections(place);
      } else if (!isLocating) {
        // if user location is not available,get it
        getUserLocation();
        // show a message that location is needed for directions
        setLocationError("Getting your location to show directions...");
      }
    }
  };

  const handleCloseDetails = () => {
    setSelectedPlace(null);
    clearRoute();
  };

  const handlePrevImage = () => {
    if (!selectedPlace || !selectedPlace.images || selectedPlace.images.length <= 1) return;
    
    setCurrentImageIndex(prev => 
      (prev - 1 + selectedPlace.images.length) % selectedPlace.images.length
    );
  };

  const handleNextImage = () => {
    if (!selectedPlace || !selectedPlace.images || selectedPlace.images.length <= 1) return;
    
    setCurrentImageIndex(prev => 
      (prev + 1) % selectedPlace.images.length
    );
  };

  //formatting distance
  const formatDistance = (distance: number) => {
    return distance < 1 
      ? `${Math.round(distance * 1000)} meters` 
      : `${distance.toFixed(1)} km`;
  };

  //formatting time
  const formatTime = (minutes: number) => {
    if (minutes < 1) return "Less than a minute";
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    return remainingMinutes > 0 
      ? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min` 
      : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  //for testing route
  const useTestRoute = () => {
    console.log("test route");
    setRouteCoordinates(TEST_ROUTE);
    setRouteInfo({
      distance: 2.2,
      time: 5
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* navbar */}
      <nav className="bg-zinc-900 p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-white">
            LaptopZone
          </Link>
          
          {/*loc button*/}
          <button
            onClick={getUserLocation}
            disabled={isLocating}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-md transition-colors"
            title="Get your location"
          >
            <Navigation size={16} className={isLocating ? "animate-pulse" : ""} />
            <span>
              {isLocating ? "Getting location..." : "reload location"}
            </span>
          </button>
        </div>
      </nav>

      {/* main */}
      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-[#ffa500]" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Explore Laptop-Friendly Places
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto mb-8">
                Discover the best places to work with your laptop in Addis Ababa.
              </p>
            </div>
            
            {/*loc error message*/}
            {locationError && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-md flex justify-between items-center">
                <p>{locationError}</p>
                <button onClick={() => setLocationError(null)} className="text-red-200 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            )}
            
            {/*place count*/}
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <MapPin className="h-5 w-5 text-[#ffa500]" />
              <span>{places.length} {places.length === 1 ? 'place' : 'places'} found</span>
            </div>
            
            {/*map and details*/}
            <div className="relative">
              {/*the map*/}
              <div className="w-full h-[80vh] sm:h-[70vh] md:h-[80vh] rounded-xl overflow-hidden shadow-lg border border-zinc-800 relative">
                {!loading && (
                  <GebetaMap
                    apiKey={GEBETA_API_KEY}
                    center={mapCenter}
                    zoom={12}
                    style="basic"
                  >
                    {/*user loc*/}
                    {mapLoaded && userLocation && (
                      <MapMarker
                        id="user-location"
                        lngLat={userLocation}
                        color="#3b82f6"
                      />
                    )}
                    
                    {/*markers*/}
                    {mapLoaded && places.map((place) => (
                      <MapMarker
                        key={place._id}
                        id={place._id}
                        lngLat={[place.longitude, place.latitude] as [number, number]}
                        color="#ffa500"
                        onClick={() => handleMarkerClick(place._id)}
                      />
                    ))}
                    
                    {/*polyline*/}
                    {mapLoaded && routeCoordinates.length > 1 && (
                      <MapPolyline
                        id="route-path"
                        coordinates={routeCoordinates}
                        color="#3b82f6"
                        width={4}
                      />
                    )}
                  </GebetaMap>
                )}
                
                {/*for debugging*/}
                {process.env.NODE_ENV !== "production" && (
                  <button
                    onClick={useTestRoute}
                    className="absolute bottom-4 left-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors text-xs"
                    title="Test route display with hardcoded coordinates"
                  >
                    Test Route
                  </button>
                )}
              </div>
              
              {/*for desktop detail*/}
              {selectedPlace && (
                <div className="hidden sm:block absolute bottom-4 right-4 w-80 bg-zinc-900 p-4 rounded-lg shadow-lg border border-zinc-700 max-h-[80vh] overflow-y-auto">
                  <button 
                    onClick={handleCloseDetails}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white z-10 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700"
                    aria-label="Close details"
                  >
                    ×
                  </button>
                  
                  {/* Image slider */}
                  <div className="relative w-full h-40 mb-3 bg-zinc-800 rounded-md overflow-hidden">
                    {/* Current image */}
                    <Image
                      src={selectedPlace.images && selectedPlace.images.length > 0 
                        ? selectedPlace.images[currentImageIndex] 
                        : "/assets/placeholder.jpg"}
                      alt={`${selectedPlace.name} - Image ${currentImageIndex + 1}`}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                    
                    {/* Navigation arrows - only show if multiple images */}
                    {selectedPlace.images && selectedPlace.images.length > 1 && (
                      <>
                        <button 
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-1 rounded-full hover:bg-opacity-70"
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={20} className="text-white" />
                        </button>
                        <button 
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-1 rounded-full hover:bg-opacity-70"
                          aria-label="Next image"
                        >
                          <ChevronRight size={20} className="text-white" />
                        </button>
                        
                        {/* Image indicator dots */}
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                          {selectedPlace.images.map((_, idx) => (
                            <div 
                              key={idx} 
                              className={`h-1.5 w-1.5 rounded-full mx-0.5 ${idx === currentImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2">{selectedPlace.name}</h3>
                  <p className="text-gray-300 text-sm mb-1">
                    <span className="font-medium">Phone:</span> {selectedPlace.phone}
                  </p>
                  {selectedPlace.openHours && (
                    <p className="text-gray-300 text-sm mb-1">
                      <span className="font-medium">Hours:</span> {selectedPlace.openHours}
                    </p>
                  )}
                  {selectedPlace.openDays && (
                    <p className="text-gray-300 text-sm mb-1">
                      <span className="font-medium">Days:</span> {selectedPlace.openDays}
                    </p>
                  )}
                  
                  {/*info on route*/}
                  {routeInfo && (
                    <div className="mt-3 pt-3 border-t border-zinc-700">
                      <p className="text-sm text-[#3b82f6] font-medium">Route Information</p>
                      <div className="flex justify-between text-xs text-gray-300 mt-1">
                        <span>Distance: {formatDistance(routeInfo.distance)}</span>
                        <span>Time: {formatTime(routeInfo.time)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/*status and hide */}
                  <div className="mt-3">
                    {routeCoordinates.length > 0 ? (
                      <button
                        onClick={clearRoute}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-md transition-colors"
                      >
                        hide direction
                      </button>
                    ) : routeLoading ? (
                      <div className="w-full bg-zinc-800 text-white py-2 rounded-md flex items-center justify-center">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Getting Route...
                      </div>
                    ) : !userLocation ? (
                      <div className="text-center text-amber-400 text-sm">
                        turn on  location to see the route
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
            
            {/*detail for mobile*/}
            {selectedPlace && (
              <div className="sm:hidden bg-zinc-900 p-4 rounded-lg shadow-lg border border-zinc-700 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg">{selectedPlace.name}</h3>
                  <button 
                    onClick={handleCloseDetails}
                    className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700"
                    aria-label="Close details"
                  >
                    ×
                  </button>
                </div>
                
                {/*slider*/}
                <div className="relative w-full h-40 mb-3 bg-zinc-800 rounded-md overflow-hidden">
                  {/*current img*/}
                  <Image
                    src={selectedPlace.images && selectedPlace.images.length > 0 
                      ? selectedPlace.images[currentImageIndex] 
                      : "/assets/placeholder.jpg"}
                    alt={`${selectedPlace.name} - Image ${currentImageIndex + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="100vw"
                  />
                  
                  {/*for nav arrows*/}
                  {selectedPlace.images && selectedPlace.images.length > 1 && (
                    <>
                      <button 
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-1 rounded-full hover:bg-opacity-70"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={20} className="text-white" />
                      </button>
                      <button 
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-1 rounded-full hover:bg-opacity-70"
                        aria-label="Next image"
                      >
                        <ChevronRight size={20} className="text-white" />
                      </button>
                      
                      {/*indicator(which img)*/}
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                        {selectedPlace.images.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`h-1.5 w-1.5 rounded-full mx-0.5 ${idx === currentImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                <p className="text-gray-300 text-sm mb-1">
                  <span className="font-medium">Phone:</span> {selectedPlace.phone}
                </p>
                {selectedPlace.openHours && (
                  <p className="text-gray-300 text-sm mb-1">
                    <span className="font-medium">Hours:</span> {selectedPlace.openHours}
                  </p>
                )}
                {selectedPlace.openDays && (
                  <p className="text-gray-300 text-sm mb-1">
                    <span className="font-medium">Days:</span> {selectedPlace.openDays}
                  </p>
                )}
                
                {/*route info*/}
                {routeInfo && (
                  <div className="mt-3 pt-3 border-t border-zinc-700">
                    <p className="text-sm text-[#3b82f6] font-medium">Route Information</p>
                    <div className="flex justify-between text-xs text-gray-300 mt-1">
                      <span>Distance: {formatDistance(routeInfo.distance)}</span>
                      <span>Time: {formatTime(routeInfo.time)}</span>
                    </div>
                  </div>
                )}
                
                {/*status and hide*/}
                <div className="mt-3">
                  {routeCoordinates.length > 0 ? (
                    <button
                      onClick={clearRoute}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-md transition-colors"
                    >
                      Hide direction
                    </button>
                  ) : routeLoading ? (
                    <div className="w-full bg-zinc-800 text-white py-2 rounded-md flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Getting direction...
                    </div>
                  ) : !userLocation ? (
                    <div className="text-center text-amber-400 text-sm">
                      turn on location to see routes
                    </div>
                  ) : null}
                </div>
              </div>
            )}
            
            <div className="flex justify-center">
              <Link 
                href="/"
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-md transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 