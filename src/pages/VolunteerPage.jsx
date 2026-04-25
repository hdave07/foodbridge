import { useState, useEffect } from 'react'
import { db, storage } from '../firebase'
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getVolunteerLocation, haversineDistance } from '../geo'
import { getRouteOrder, verifyPhoto } from '../claude'

const FOOD_EMOJI = { 'Noodles':'🍜', 'Cooked meals':'🍱', 'Bread & bakery':'🥖', 'Dim sum':'🥟', 'Drinks':'🧃' }

const IMPACT = [
  { num: '143', label: 'Meals rescued',    delta: '↑ 3× last Saturday' },
  { num: '7',   label: 'Pickups done',     delta: 'Top 12% this week'  },
  { num: '4',   label: 'Partners thanked', delta: 'Via Claude drafts'  },
]

function formatTime(val) {
  if (!val) return '—'
  if (typeof val === 'string') return val
  if (val?.toDate) return val.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return String(val)
}

export default function VolunteerPage() {
  const [form, setForm] = useState({ name: '', phone: '', district: '', availability: '', transport: '' })
  const [pledged, setPledged] = useState(false)
  const [pledgeError, setPledgeError] = useState(false)
  const [registered, setRegistered] = useState(false)

  const [listings, setListings] = useState([])
  const [claimed, setClaimed] = useState({}) // IDs claimed this session

  const [volunteerLocation, setVolunteerLocation] = useState(null)
  const [route, setRoute] = useState(null)
  const [routeReason, setRouteReason] = useState('')
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')

  const [photos, setPhotos] = useState([])
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)

  const [flagCount, setFlagCount] = useState(0)
  const FLAG_THRESHOLD = 3
  const isLocked = flagCount >= FLAG_THRESHOLD

  // Listings claimed this session that are still in 'claimed' status in Firestore
  const sessionClaimedListings = listings.filter(l => claimed[l.id] && l.status === 'claimed')
  const sessionClaimedIds = sessionClaimedListings.map(l => l.id)

  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    getVolunteerLocation().then(setVolunteerLocation).catch(() => {})
  }, [])

  useEffect(() => {
    if (sessionClaimedIds.length < 2) { setRoute(null); setRouteReason(''); return }
    if (!volunteerLocation) return
    setRouteLoading(true)
    setRouteError('')
    getRouteOrder(volunteerLocation.lat, volunteerLocation.lng, sessionClaimedListings)
      .then(({ order, reason }) => { setRoute(order); setRouteReason(reason) })
      .catch(err => setRouteError(err.message))
      .finally(() => setRouteLoading(false))
  }, [sessionClaimedIds.join(','), volunteerLocation])

  function handleInput(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.name.trim()) return
    if (!pledged) {
      setPledgeError(true)
      setTimeout(() => setPledgeError(false), 1800)
      return
    }
    await addDoc(collection(db, 'volunteers'), { ...form, pledged: true, createdAt: serverTimestamp() })
    setRegistered(true)
  }

  async function handleClaim(id) {
    setClaimed(prev => ({ ...prev, [id]: true }))
    await updateDoc(doc(db, 'listings', id), {
      status: 'claimed',
      claimedBy: form.name || 'volunteer',
    })
  }

  function handleFiles(e) {
    const newFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    setPhotos(prev => [...prev, ...newFiles])
    setVerifyResult(null)
  }

  function removePhoto(i) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
    setVerifyResult(null)
  }

  async function handleVerify() {
    if (!photos[0]) return
    setVerifying(true)
    setVerifyResult(null)
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `deliveries/${Date.now()}_${photos[0].name}`)
      await uploadBytes(storageRef, photos[0])
      const photoUrl = await getDownloadURL(storageRef)

      // Verify with Claude Vision
      const base64 = await toBase64(photos[0])
      const { verified, flagged, reason } = await verifyPhoto(base64)

      if (!verified) {
        setFlagCount(prev => prev + 1)
      }

      // Mark the first session-claimed listing as completed
      const targetId = sessionClaimedIds[0]
      if (targetId) {
        await updateDoc(doc(db, 'listings', targetId), {
          status: 'completed',
          photoUrl,
          aiVerified: verified,
          aiFlagged: flagged ?? false,
          aiReason: reason,
        })
      }

      setVerifyResult({ ok: verified, text: verified ? `Delivery verified — ${reason}` : `Could not verify — ${reason}` })
    } catch (err) {
      setVerifyResult({ ok: false, text: `Error: ${err.message}` })
    } finally {
      setVerifying(false)
    }
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const orderedClaimedListings = route
    ? route.map(id => sessionClaimedListings.find(l => l.id === id)).filter(Boolean)
    : sessionClaimedListings

  const inputClass = 'w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[340px_1fr] gap-5 items-start">

        {/* LEFT COLUMN */}
        <div className="space-y-4">

          {/* Registration card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4 pb-3 border-b border-stone-100">
              Join as a volunteer
            </p>

            {registered ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 text-lg">✓</div>
                <p className="font-medium text-stone-800 text-sm">You're on the team!</p>
                <p className="text-stone-500 text-xs mt-1">We'll WhatsApp you when a listing opens near you.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Full name</label>
                  <input name="name" value={form.name} onChange={handleInput} placeholder="Jane Smith" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">WhatsApp number</label>
                  <input name="phone" value={form.phone} onChange={handleInput} placeholder="+1 212 555 0123" type="tel" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">District</label>
                    <select name="district" value={form.district} onChange={handleInput} className={inputClass}>
                      <option value="">Select…</option>
                      {['East Village', 'Lower East Side', "Hell's Kitchen", 'Midtown', 'Brooklyn', 'Harlem'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">Availability</label>
                    <select name="availability" value={form.availability} onChange={handleInput} className={inputClass}>
                      <option value="">Select…</option>
                      {['Evenings (5–9pm)', 'Weekends', 'Flexible'].map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Transport</label>
                  <select name="transport" value={form.transport} onChange={handleInput} className={inputClass}>
                    <option value="">Select…</option>
                    {['On foot', 'Bicycle / e-bike', 'Motorcycle', 'Car / van', 'Public transit'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className={`rounded-xl p-3 flex gap-2.5 items-start border transition ${pledgeError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <input type="checkbox" id="pledge" checked={pledged} onChange={e => setPledged(e.target.checked)} className="mt-0.5 accent-green-600 flex-shrink-0" />
                  <label htmlFor="pledge" className="text-xs text-green-900 leading-relaxed cursor-pointer">
                    <span className="font-semibold block mb-0.5">Volunteer pledge</span>
                    I commit to showing up for claimed pickups, handling food safely, and treating all recipients with dignity and respect.
                  </label>
                </div>

                <button onClick={handleSubmit} className="w-full py-2.5 bg-stone-800 text-white rounded-xl text-sm font-semibold hover:bg-stone-700 transition-colors">
                  Register as volunteer
                </button>
              </div>
            )}
          </div>

          {/* Photo upload card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3 pb-3 border-b border-stone-100">
              Upload delivery photos
            </p>
            <p className="text-xs text-stone-500 leading-relaxed mb-3">
              After a pickup, upload a photo so Claude Vision can verify the delivery and log it to the impact dashboard.
            </p>

            {photos.length === 0 ? (
              <label className="block border-2 border-dashed border-stone-200 rounded-xl p-6 text-center cursor-pointer hover:bg-stone-50 hover:border-green-400 transition">
                <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
                <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-2 text-stone-400 text-sm">↑</div>
                <p className="text-xs font-medium text-stone-600">Drop photos or click to browse</p>
                <p className="text-xs text-stone-400 mt-0.5">PNG, JPG — compressed for Claude Vision</p>
              </label>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {photos.map((f, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-stone-200 relative">
                      <img src={URL.createObjectURL(f)} alt="preview" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-4 h-4 bg-black/50 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  {photos.length < 8 && (
                    <label className="aspect-square border-2 border-dashed border-stone-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-stone-50 text-stone-400 text-xl">
                      <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
                      +
                    </label>
                  )}
                </div>
                <button onClick={handleVerify} disabled={verifying}
                  className="w-full py-2.5 border border-green-600 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition disabled:opacity-50">
                  {verifying ? 'Uploading & verifying…' : 'Verify with Claude Vision ↗'}
                </button>
              </>
            )}

            {verifyResult && (
              <div className={`mt-3 p-3 rounded-xl text-xs leading-relaxed border ${verifyResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {verifyResult.ok ? '✓' : '✗'} {verifyResult.text}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* Listings card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Open listings near you</p>
              <span className="text-xs text-green-600 font-medium">
                {listings.filter(l => l.status === 'open').length} available
              </span>
            </div>

            {isLocked && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
                Account locked — {FLAG_THRESHOLD} failed verifications. Contact support to appeal.
              </div>
            )}
            {!isLocked && flagCount > 0 && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Warning: {flagCount}/{FLAG_THRESHOLD} verification failures. Account locks at {FLAG_THRESHOLD}.
              </div>
            )}

            {listings.length === 0 && (
              <p className="text-xs text-stone-400 text-center py-4">Loading listings…</p>
            )}

            <div className="space-y-3">
              {listings.map(l => {
                const isClaimed = l.status === 'claimed'
                const isCompleted = l.status === 'completed'
                return (
                  <div key={l.id} className={`border rounded-xl p-3.5 transition ${isCompleted || isClaimed ? 'opacity-60 border-stone-100' : 'border-stone-200 hover:border-green-300 hover:bg-green-50/30'}`}>
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-lg flex-shrink-0">
                        {FOOD_EMOJI[l.foodType] || '🍽️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate">{l.restaurantName}</p>
                        <p className="text-xs text-stone-500">{l.address}</p>
                      </div>
                      {isCompleted && (
                        <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${l.aiVerified ? 'bg-green-100 text-green-800 border-green-300' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                          {l.aiVerified ? 'AI Verified ✓' : 'Completed'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">{l.foodType}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">{l.quantity} portions</span>
                      {volunteerLocation && l.lat && l.lng && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {haversineDistance(volunteerLocation.lat, volunteerLocation.lng, l.lat, l.lng).toFixed(1)} mi away
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-stone-400">
                        Pickup <span className="text-stone-600">{formatTime(l.pickupStart)}–{formatTime(l.pickupEnd)}</span>
                      </p>
                      {isCompleted || isClaimed
                        ? <span className="text-xs font-medium text-green-600">{isCompleted ? 'Completed ✓' : 'Claimed ✓'}</span>
                        : isLocked
                          ? <span className="text-xs font-medium text-red-400">Account locked</span>
                          : (
                            <button onClick={() => handleClaim(l.id)}
                              className="text-xs font-medium text-green-700 border border-green-600 px-3 py-1 rounded-full hover:bg-green-600 hover:text-white transition">
                              Claim pickup
                            </button>
                          )
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Claude route card — appears after 2+ session claims */}
          {sessionClaimedIds.length >= 2 && (
            <div className="bg-white border border-green-200 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 pb-3 border-b border-stone-100">
                <span className="text-green-600">Claude</span> · Optimized route
              </p>

              {routeLoading && <p className="text-xs text-stone-400 py-2">Calculating best route…</p>}
              {routeError && <p className="text-xs text-red-400 py-2">{routeError}</p>}

              {!routeLoading && !routeError && orderedClaimedListings.length > 0 && (
                <div className="space-y-2">
                  {orderedClaimedListings.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${i === 0 ? 'bg-green-100 text-green-800' : i === 1 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        Stop {i + 1}
                      </span>
                      <span className="text-sm font-medium text-stone-800 truncate">{l.restaurantName}, {l.address?.split(',')[1]?.trim() || l.address}</span>
                    </div>
                  ))}
                  {routeReason && (
                    <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-500 leading-relaxed mt-1">
                      <span className="font-semibold text-stone-700 block mb-1">Claude's reasoning</span>
                      {routeReason}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Impact card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4 pb-3 border-b border-stone-100">
              Your impact
            </p>
            <div className="grid grid-cols-3 gap-3">
              {IMPACT.map(s => (
                <div key={s.label} className="bg-stone-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{s.num}</p>
                  <p className="text-xs text-stone-500 mt-1">{s.label}</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">{s.delta}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
