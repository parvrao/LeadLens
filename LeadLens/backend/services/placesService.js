// services/placesService.js
const { checkAndIncrement } = require("./quotaTracker");
const axios = require('axios');

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

/**
 * Search businesses via Google Places API Text Search
 */
async function searchBusinesses(query, location, radius = 50000, maxResults = 20) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    // Fallback: return mock data structure for development/demo
    console.warn('GOOGLE_PLACES_API_KEY not set — returning demo data');
    return generateDemoLeads(query, location, maxResults);
  }

  const results = [];
  let pageToken = null;
  let pagesFetched = 0;

  try {
    do {
      const params = {
        query: `${query} in ${location}`,
        key: apiKey,
        fields: 'place_id,name,formatted_address,geometry,rating,user_ratings_total,types,formatted_phone_number,website,opening_hours',
      };

      if (pageToken) params.pagetoken = pageToken;

      const quotaCheck = checkAndIncrement("places"); if (!quotaCheck.allowed) throw new Error(quotaCheck.error);
  const response = await axios.get(`${PLACES_BASE}/textsearch/json`, { params });
      const data = response.data;

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${data.status} — ${data.error_message || ''}`);
      }

      for (const place of (data.results || [])) {
        if (results.length >= maxResults) break;
        results.push(normalizePlaceResult(place));
      }

      pageToken = data.next_page_token || null;
      pagesFetched++;

      // Must wait 2s before using next_page_token
      if (pageToken && results.length < maxResults) {
        await new Promise(r => setTimeout(r, 2000));
      }
    } while (pageToken && results.length < maxResults && pagesFetched < 3);

  } catch (err) {
    console.error('Places search error:', err.message);
    throw err;
  }

  return results;
}

/**
 * Get detailed place info including reviews
 */
async function getPlaceDetails(placeId) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.get(`${PLACES_BASE}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews,geometry,types,opening_hours,url',
        key: apiKey
      }
    });

    const place = response.data.result;
    if (!place) return null;

    return {
      ...normalizePlaceResult(place),
      reviews: (place.reviews || []).map(r => ({
        rating: r.rating,
        text: r.text,
        time: r.time,
        authorName: r.author_name
      })),
      googleUrl: place.url,
      openingHours: place.opening_hours?.weekday_text || []
    };
  } catch (err) {
    console.error('Place details error:', err.message);
    return null;
  }
}

/**
 * Find email for a domain using Hunter.io
 */
async function findEmail(domain, companyName) {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey || !domain) return null;

  try {
    const response = await axios.get('https://api.hunter.io/v2/domain-search', {
      params: {
        domain: domain.replace(/https?:\/\//, '').replace(/\/.*$/, ''),
        company: companyName,
        api_key: apiKey,
        limit: 3
      }
    });

    const emails = response.data?.data?.emails || [];
    return emails.length > 0 ? emails[0].value : null;
  } catch (err) {
    console.error('Hunter email lookup error:', err.message);
    return null;
  }
}

function normalizePlaceResult(place) {
  const addressParts = (place.formatted_address || '').split(',');
  return {
    placeId: place.place_id,
    businessName: place.name,
    address: addressParts[0]?.trim() || '',
    city: addressParts[1]?.trim() || '',
    state: addressParts[2]?.trim() || '',
    country: addressParts[addressParts.length - 1]?.trim() || '',
    phone: place.formatted_phone_number || null,
    website: place.website || null,
    rating: place.rating || null,
    reviewCount: place.user_ratings_total || 0,
    category: (place.types || [])[0]?.replace(/_/g, ' ') || 'business',
    lat: place.geometry?.location?.lat || null,
    lng: place.geometry?.location?.lng || null
  };
}

/**
 * Generate realistic demo leads for development (no API key needed)
 */
function generateDemoLeads(query, location, count = 10) {
  const industries = ['Restaurant', 'Dental Clinic', 'Law Firm', 'Auto Repair', 'Gym', 'Salon', 'Real Estate Agency', 'Accounting Firm'];
  const statuses = ['new', 'new', 'new', 'contacted'];

  return Array.from({ length: Math.min(count, 15) }, (_, i) => ({
    placeId: `demo_${Date.now()}_${i}`,
    businessName: `${location} ${industries[i % industries.length]} ${i + 1}`,
    address: `${100 + i * 10} Main Street`,
    city: location,
    state: 'CA',
    country: 'United States',
    phone: `+1 (555) ${String(100 + i).padStart(3, '0')}-${String(1000 + i).padStart(4, '0')}`,
    website: `https://example-${i + 1}.com`,
    rating: (3.5 + Math.random() * 1.5).toFixed(1) * 1,
    reviewCount: Math.floor(Math.random() * 200) + 10,
    category: industries[i % industries.length].toLowerCase(),
    lat: 34.0522 + (Math.random() - 0.5) * 0.1,
    lng: -118.2437 + (Math.random() - 0.5) * 0.1,
    status: statuses[i % statuses.length],
    isDemoData: true
  }));
}

module.exports = { searchBusinesses, getPlaceDetails, findEmail };
