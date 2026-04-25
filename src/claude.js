export async function getRouteOrder(volunteerLat, volunteerLng, listings) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are a food rescue coordinator. A volunteer is at coordinates ${volunteerLat}, ${volunteerLng}. Here are the open food listings: ${JSON.stringify(listings)}. Return a JSON array of listing IDs in the optimal pickup order, prioritizing listings expiring soonest. Include a one-sentence reason for the top pick. Format: { "order": ["id1","id2",...], "reason": "..." }`
          }
        ]
      })
    })
    const data = await response.json()
    const text = data.content[0].text
    return JSON.parse(text)
  }
  
  export async function verifyPhoto(base64Image) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: base64Image }
              },
              {
                type: "text",
                text: `This photo was submitted by a food rescue volunteer as proof of distribution to homeless individuals. Does this image plausibly show food being shared in a communal or public context? Respond with JSON only: { "verified": true/false, "reason": "one sentence" }`
              }
            ]
          }
        ]
      })
    })
    const data = await response.json()
    const text = data.content[0].text
    return JSON.parse(text)
  }