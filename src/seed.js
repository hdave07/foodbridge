import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const listings = [
  { restaurantName: "Xi'an Famous Foods", address: "81 St Marks Pl, East Village", lat: 40.7265, lng: -73.9822, foodType: "Noodles", quantity: 35, notes: "", status: "open", claimedBy: null, photoUrl: null, aiVerified: null },
  { restaurantName: "Kopitiam", address: "151 E Broadway, Lower East Side", lat: 40.7136, lng: -73.9941, foodType: "Cooked meals", quantity: 22, notes: "", status: "open", claimedBy: null, photoUrl: null, aiVerified: null },
  { restaurantName: "Sullivan St Bakery", address: "533 W 47th St, Hell's Kitchen", lat: 40.7614, lng: -73.9954, foodType: "Bread & bakery", quantity: 55, notes: "", status: "open", claimedBy: null, photoUrl: null, aiVerified: null },
  { restaurantName: "Superiority Burger", address: "119 Avenue A, East Village", lat: 40.7261, lng: -73.9807, foodType: "Cooked meals", quantity: 20, notes: "", status: "claimed", claimedBy: "demo_volunteer", photoUrl: null, aiVerified: null },
]

async function seed() {
  for (const listing of listings) {
    await addDoc(collection(db, "listings"), {
      ...listing,
      pickupStart: Timestamp.fromDate(new Date()),
      pickupEnd: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)),
      createdAt: Timestamp.fromDate(new Date()),
    })
    console.log("Added:", listing.restaurantName)
  }
  console.log("Seed complete!")
}

seed()