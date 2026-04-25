import { NYC_SHELTERS } from './data/shelters.js'

export function assignNearestShelter(listing) {
  if (!listing.lat || !listing.lng) return NYC_SHELTERS[0]
  return NYC_SHELTERS.reduce((nearest, shelter) => {
    const d = haversineDistance(listing.lat, listing.lng, shelter.lat, shelter.lng)
    const dNearest = haversineDistance(listing.lat, listing.lng, nearest.lat, nearest.lng)
    return d < dNearest ? shelter : nearest
  })
}

export function getVolunteerLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  })
}

// Returns distance in miles between two lat/lng points
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
