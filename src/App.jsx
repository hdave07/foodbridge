import { db } from "./firebase"
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore"

import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import RestaurantPage from "./pages/RestaurantPage"
import VolunteerPage from "./pages/VolunteerPage"
import MapPage from "./pages/MapPage"

export default function App() {
  async function seedData() {
    // Clear all existing listings first
    const existing = await getDocs(collection(db, "listings"))
    for (const d of existing.docs) {
      await deleteDoc(doc(db, "listings", d.id))
    }

    const listings = [
      { restaurantName: "Xi'an Famous Foods", address: "81 St Marks Pl, East Village", lat: 40.7265, lng: -73.9822, foodType: "Noodles", quantity: 35, pickupStart: "18:00", pickupEnd: "20:00", notes: "", status: "open", claimedBy: null, photoUrl: null, aiVerified: null },
      { restaurantName: "Kopitiam", address: "151 E Broadway, Lower East Side", lat: 40.7136, lng: -73.9941, foodType: "Cooked meals", quantity: 22, pickupStart: "17:30", pickupEnd: "19:30", notes: "", status: "open", claimedBy: null, photoUrl: null, aiVerified: null },
      { restaurantName: "Sullivan St Bakery", address: "533 W 47th St, Hell's Kitchen", lat: 40.7614, lng: -73.9954, foodType: "Bread & bakery", quantity: 55, pickupStart: "17:00", pickupEnd: "18:30", notes: "", status: "open", claimedBy: null, photoUrl: null, aiVerified: null },
      { restaurantName: "Superiority Burger", address: "119 Avenue A, East Village", lat: 40.7261, lng: -73.9807, foodType: "Cooked meals", quantity: 20, pickupStart: "19:00", pickupEnd: "21:00", notes: "", status: "open", claimedBy: null, photoUrl: null, aiVerified: null },
    ]
    for (const listing of listings) {
      await addDoc(collection(db, "listings"), { ...listing, createdAt: serverTimestamp() })
      console.log("Added:", listing.restaurantName)
    }
    alert("Seed complete! 4 clean listings added.")
  }
  return (
    <BrowserRouter>
      <nav className="flex gap-6 p-4 border-b text-sm font-medium">
        <Link to="/restaurant">Restaurant</Link>
        <Link to="/volunteer">Volunteer</Link>
        <Link to="/map">Map</Link>
        <button onClick={seedData} className="ml-auto text-xs text-gray-400">Seed DB</button>
      </nav>
      <Routes>
        <Route path="/restaurant" element={<RestaurantPage />} />
        <Route path="/volunteer" element={<VolunteerPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/" element={<RestaurantPage />} />
      </Routes>
    </BrowserRouter>
  )
}