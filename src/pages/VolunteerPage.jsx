// export default function VolunteerPage() {
//     return <div className="p-6"><h1 className="text-2xl font-bold">Volunteer</h1></div>
//   }

  import { useState } from "react";
  import "./VolunteerPage.css";
  
  const LISTINGS = [
    {
      id: "lc1",
      emoji: "🥟",
      name: "Dim Sum Palace",
      district: "Wan Chai",
      type: "Dim sum / Cantonese",
      boxes: 35,
      distance: "0.8 km",
      window: "6–8 PM",
      expires: "7:00 PM",
      iconBg: "#E1F5EE",
    },
    {
      id: "lc2",
      emoji: "🍱",
      name: "Bento Garden",
      district: "Central",
      type: "Japanese bento",
      boxes: 40,
      distance: "2.1 km",
      window: "6–8 PM",
      expires: "8:00 PM",
      iconBg: "#FAEEDA",
    },
    {
      id: "lc3",
      emoji: "🍕",
      name: "Mama Mia Pizzeria",
      district: "TST",
      type: "Pizza / Italian",
      boxes: 18,
      distance: "3.4 km",
      window: "7–9 PM",
      expires: "9:00 PM",
      iconBg: "#E6F1FB",
    },
  ];
  
  const IMPACT = [
    { num: "143", label: "Meals rescued",    delta: "↑ 3× last Saturday" },
    { num: "7",   label: "Pickups done",     delta: "Top 12% this week"  },
    { num: "4",   label: "Partners thanked", delta: "Via Claude drafts"  },
  ];
  
  export default function VolunteerPage() {
    const [form, setForm] = useState({ name: "", phone: "", district: "", availability: "", transport: "" });
    const [pledged, setPledged] = useState(false);
    const [pledgeError, setPledgeError] = useState(false);
    const [registered, setRegistered] = useState(false);
  
    const [claimed, setClaimed] = useState({});
    const claimedCount = Object.values(claimed).filter(Boolean).length;
  
    const [photos, setPhotos] = useState([]);
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState(null);
  
    function handleInput(e) {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  
    function handleSubmit() {
      if (!form.name.trim()) { document.getElementById("v-name").focus(); return; }
      if (!pledged) {
        setPledgeError(true);
        setTimeout(() => setPledgeError(false), 1800);
        return;
      }
      setRegistered(true);
      // TODO: addDoc(collection(db, "volunteers"), { ...form, pledged: true, createdAt: serverTimestamp() })
    }
  
    function handleClaim(id) {
      setClaimed((prev) => ({ ...prev, [id]: true }));
      // TODO: updateDoc(doc(db, "listings", id), { claimedBy: currentUser.uid })
    }
  
    function handleFiles(e) {
      const newFiles = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
      setPhotos((prev) => [...prev, ...newFiles]);
      setVerifyResult(null);
    }
  
    function removePhoto(i) {
      setPhotos((prev) => prev.filter((_, idx) => idx !== i));
      setVerifyResult(null);
    }
  
    function handleVerify() {
      setVerifying(true);
      setVerifyResult(null);
      // TODO: replace with real Claude Vision API call
      // const base64 = await toBase64(photos[0])
      // const res = await fetch("https://api.anthropic.com/v1/messages", { ... })
      setTimeout(() => {
        setVerifying(false);
        setVerifyResult("✓ Delivery verified — Claude Vision detected food containers in a public outdoor setting. Pickup logged: 35 boxes of dim sum, Wan Chai → Sham Shui Po. Impact dashboard updated.");
      }, 1800);
    }
  
    return (
      <div>
        {/* NAV */}
        <nav className="fb-nav">
          <div className="fb-nav-logo">
            <div className="fb-logo-dot" />
            FoodBridge
          </div>
          {["Map", "Volunteers", "Restaurants", "Impact"].map((t) => (
            <div key={t} className={`fb-nav-tab ${t === "Volunteers" ? "active" : ""}`}>{t}</div>
          ))}
        </nav>
  
        {/* BODY */}
        <div className="fb-page">
  
          {/* ── LEFT COLUMN ── */}
          <div>
  
            {/* Registration card */}
            <div className="fb-card">
              <div className="fb-card-title">Join as a volunteer</div>
  
              {registered ? (
                <div className="fb-success-state">
                  <div className="fb-success-icon">✓</div>
                  <strong style={{ fontSize: 14, fontWeight: 500 }}>You're on the team!</strong>
                  <p>We'll WhatsApp you when a listing opens near you.</p>
                </div>
              ) : (
                <>
                  <div className="fb-form-group">
                    <label className="fb-form-label">Full name</label>
                    <input id="v-name" className="fb-form-input" type="text" name="name" placeholder="Jane Smith" value={form.name} onChange={handleInput} />
                  </div>
  
                  <div className="fb-form-group">
                    <label className="fb-form-label">WhatsApp number</label>
                    <input className="fb-form-input" type="tel" name="phone" placeholder="+852 9123 4567" value={form.phone} onChange={handleInput} />
                  </div>
  
                  <div className="fb-form-row">
                    <div className="fb-form-group">
                      <label className="fb-form-label">District</label>
                      <select className="fb-form-select" name="district" value={form.district} onChange={handleInput}>
                        <option value="">Select…</option>
                        {["Wan Chai","Central","Causeway Bay","TST","Mong Kok","Sham Shui Po"].map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="fb-form-group">
                      <label className="fb-form-label">Availability</label>
                      <select className="fb-form-select" name="availability" value={form.availability} onChange={handleInput}>
                        <option value="">Select…</option>
                        {["Evenings (5–9pm)","Weekends","Flexible"].map((a) => <option key={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
  
                  <div className="fb-form-group">
                    <label className="fb-form-label">Transport</label>
                    <select className="fb-form-select" name="transport" value={form.transport} onChange={handleInput}>
                      <option value="">Select…</option>
                      {["On foot","Bicycle / e-bike","Motorcycle","Car / van","Public transit"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
  
                  <div className={`fb-pledge-box ${pledgeError ? "error" : ""}`}>
                    <input type="checkbox" id="pledge" checked={pledged} onChange={(e) => setPledged(e.target.checked)} />
                    <label htmlFor="pledge" className="fb-pledge-text">
                      <strong>Volunteer pledge</strong>
                      I commit to showing up for claimed pickups, handling food safely, and treating all recipients with dignity and respect.
                    </label>
                  </div>
  
                  <button className="fb-btn-primary" onClick={handleSubmit}>Register as volunteer</button>
                </>
              )}
            </div>
  
            {/* Photo upload card */}
            <div className="fb-card">
              <div className="fb-card-title">Upload delivery photos</div>
              <p className="fb-upload-hint">After a pickup, upload a photo so Claude Vision can verify the delivery and log it to the impact dashboard.</p>
  
              {photos.length === 0 ? (
                <label className="fb-upload-zone">
                  <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
                  <div className="fb-upload-icon">↑</div>
                  <div className="fb-upload-zone-label">Drop photos or click to browse</div>
                  <div className="fb-upload-zone-hint">PNG, JPG — compressed for Claude Vision</div>
                </label>
              ) : (
                <>
                  <div className="fb-thumb-grid">
                    {photos.map((f, i) => (
                      <div key={i} className="fb-thumb">
                        <img src={URL.createObjectURL(f)} alt="preview" />
                        <button className="fb-thumb-rm" onClick={() => removePhoto(i)}>✕</button>
                      </div>
                    ))}
                    {photos.length < 8 && (
                      <label className="fb-thumb-add">
                        <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
                        +
                      </label>
                    )}
                  </div>
                  <button className="fb-btn-outline" onClick={handleVerify} disabled={verifying}>
                    {verifying ? "Verifying…" : "Verify with Claude Vision ↗"}
                  </button>
                </>
              )}
  
              {verifyResult && <div className="fb-verify-result">{verifyResult}</div>}
            </div>
          </div>
  
          {/* ── RIGHT COLUMN ── */}
          <div>
  
            {/* Listings card */}
            <div className="fb-card">
              <div className="fb-card-title">
                Open listings near you
                <span className="available-count">{LISTINGS.length - claimedCount} available</span>
              </div>
  
              {LISTINGS.map((l) => (
                <div key={l.id} className={`fb-listing-card ${claimed[l.id] ? "claimed" : ""}`}>
                  <div className="fb-lc-top">
                    <div className="fb-lc-icon" style={{ background: l.iconBg }}>{l.emoji}</div>
                    <div>
                      <div className="fb-lc-name">{l.name} · {l.district}</div>
                      <div className="fb-lc-sub">~{l.boxes} boxes · Pickup {l.window}</div>
                    </div>
                  </div>
                  <div className="fb-lc-badges">
                    <span className="fb-badge fb-badge-green">{l.type}</span>
                    <span className="fb-badge fb-badge-amber">{l.boxes} boxes</span>
                    <span className="fb-badge fb-badge-blue">{l.distance} away</span>
                  </div>
                  <div className="fb-lc-meta">
                    <div className="fb-lc-expiry">Expires <span>{l.expires}</span></div>
                    {claimed[l.id]
                      ? <span className="fb-claimed-label">Claimed ✓</span>
                      : <button className="fb-claim-btn" onClick={() => handleClaim(l.id)}>Claim pickup</button>
                    }
                  </div>
                </div>
              ))}
            </div>
  
            {/* Claude route card — appears after 2+ claims */}
            {claimedCount >= 2 && (
              <div className="fb-card route-card" style={{ marginTop: 16 }}>
                <div className="fb-card-title">
                  <span><span className="claude-label">Claude</span> · Optimized route</span>
                </div>
                <div className="fb-route-stops">
                  <div className="fb-route-stop">
                    <span className="fb-stop-badge fb-stop-1">Stop 1</span>
                    <span className="fb-stop-name">Dim Sum Palace, Wan Chai</span>
                  </div>
                  <div className="fb-route-stop">
                    <span className="fb-stop-badge fb-stop-2">Stop 2</span>
                    <span className="fb-stop-name">Bento Garden, Central</span>
                  </div>
                  <div className="fb-route-reasoning">
                    <strong>Claude's reasoning:</strong>
                    Wan Chai expires at 7 PM — do it first. Central's window runs until 8 PM. Skip TST unless another volunteer claims it — flag it in the group chat.
                  </div>
                </div>
              </div>
            )}
  
            {/* Impact card */}
            <div className="fb-card" style={{ marginTop: 16 }}>
              <div className="fb-card-title">Your impact</div>
              <div className="fb-impact-strip">
                {IMPACT.map((s) => (
                  <div key={s.label} className="fb-impact-stat">
                    <div className="fb-impact-num">{s.num}</div>
                    <div className="fb-impact-label">{s.label}</div>
                    <div className="fb-impact-delta">{s.delta}</div>
                  </div>
                ))}
              </div>
            </div>
  
          </div>
        </div>
      </div>
    );
  }
  