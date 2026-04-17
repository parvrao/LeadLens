const axios = require('axios');
const { checkAndIncrement } = require('./quotaTracker');

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

async function searchBusinesses(query, location, radius = 50000, maxResults = 20) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set — returning demo data');
    return generateDemoLeads(query, location, maxResults);
  }

  // Check quota before calling API
  const quota = checkAndIncrement('places');
  if (!quota.allowed) throw new Error(quota.error);

  const results = [];
  let pageToken = null;
  let pagesFetched = 0;

  try {
    do {
      const params = {
        query: `${query} in ${location}`,
        key: apiKey,
        fields: 'place_id,name,formatted_address,geometry,rating,user_ratings_total,types,formatted_phone_number,website',
      };
      if (pageToken) params.pagetoken = pageToken;

      const response = await axios.get(`${PLACES_BASE}/textsearch/json`, { params });
      const data = response.data;

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places error: ${data.status} — ${data.error_message || 'Check your API key'}`);
      }

      for (const place of (data.results || [])) {
        if (results.length >= maxResults) break;
        results.push(normalizePlaceResult(place));
      }

      pageToken = data.next_page_token || null;
      pagesFetched++;

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

async function getPlaceDetails(placeId) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.get(`${PLACES_BASE}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews,geometry,types,url',
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
      googleUrl: place.url
    };
  } catch (err) {
    console.error('Place details error:', err.message);
    return null;
  }
}

async function findEmail(domain, companyName) {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey || !domain) return null;

  // Check Hunter quota
  const quota = checkAndIncrement('hunter');
  if (!quota.allowed) {
    console.warn('Hunter quota reached:', quota.error);
    return null;
  }

  try {
    const cleanDomain = domain.replace(/https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
    const response = await axios.get('https://api.hunter.io/v2/domain-search', {
      params: { domain: cleanDomain, company: companyName, api_key: apiKey, limit: 1 }
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

function generateDemoLeads(query, location, count = 10) {
  const industries = ['Restaurant', 'Dental Clinic', 'Law Firm', 'Auto Repair', 'Gym', 'Salon', 'Real Estate Agency', 'Accounting Firm'];
  return Array.from({ length: Math.min(count, 15) }, (_, i) => ({
    placeId: `demo_${Date.now()}_${i}`,
    businessName: `${location} ${industries[i % industries.length]} ${i + 1}`,
    address: `${100 + i * 10} Main Street`,
    city: location.split(',')[0]?.trim() || location,
    state: location.split(',')[1]?.trim() || '',
    country: 'United States',
    phone: `+1 (555) ${String(200 + i).padStart(3, '0')}-${String(1000 + i * 7).padStart(4, '0')}`,
    website: `https://example-business-${i + 1}.com`,
    rating: parseFloat((3.5 + Math.random() * 1.4).toFixed(1)),
    reviewCount: Math.floor(Math.random() * 180) + 15,
    category: industries[i % industries.length].toLowerCase(),
    lat: 34.0522 + (Math.random() - 0.5) * 0.2,
    lng: -118.2437 + (Math.random() - 0.5) * 0.2,
    isDemoData: true
  }));
}

module.exports = { searchBusinesses, getPlaceDetails, findEmail };
