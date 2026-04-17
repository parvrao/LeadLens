const { GoogleGenerativeAI } = require('@google/generative-ai');
const { checkAndIncrement } = require('./quotaTracker');

let genAI;

function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

async function callGemini(prompt) {
  const quota = checkAndIncrement('gemini');
  if (!quota.allowed) throw new Error(quota.error);

  const model = getClient().getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim().replace(/```json|```/g, '').trim();
}

async function analyzePainPoints(businessData) {
  const { businessName, category, reviews = [], rating } = businessData;
  const reviewText = reviews.length > 0
    ? reviews.slice(0, 15).map((r, i) => `Review ${i+1} (${r.rating}/5): "${r.text?.slice(0,200)}"`).join('\n')
    : 'No reviews available';

  const prompt = `You are a B2B sales intelligence expert.
Business: ${businessName}
Industry: ${category}
Rating: ${rating}/5
Reviews:
${reviewText}

Return ONLY valid JSON — no markdown, no explanation:
{"painPoints":["pain1","pain2","pain3"],"opportunities":["opp1","opp2"],"businessHealth":"struggling|average|thriving","outreachScore":75,"summary":"2-3 sentence summary","keyInsight":"single most actionable insight"}

outreachScore is 1-100. Return ONLY the JSON object.`;

  try {
    const text = await callGemini(prompt);
    return JSON.parse(text);
  } catch (err) {
    console.error('Pain point analysis error:', err.message);
    return { painPoints: ['Unable to analyze'], opportunities: ['General improvement'], businessHealth: 'unknown', outreachScore: 50, summary: `${businessName} is a local ${category}.`, keyInsight: 'Review their online presence.' };
  }
}

async function generatePersonalizedEmail(businessData, offerDescription) {
  const { businessName, category, city, painPoints = [], rating, reviewCount } = businessData;

  const prompt = `You are an expert cold email copywriter.
TARGET:
- Business: ${businessName}
- Industry: ${category}
- Location: ${city || 'their area'}
- Rating: ${rating}/5 (${reviewCount} reviews)
- Key Pain: ${painPoints[0] || 'operational challenges'}

YOUR OFFER: ${offerDescription?.slice(0, 500)}

Write a cold email that:
1. Opens with something specific about THEIR business
2. Connects their pain to your offer naturally
3. Has a low-friction CTA
4. Is under 120 words
5. Feels human, not like a template
6. Uses NO hyphens — use em dashes (—) instead

Return ONLY valid JSON:
{"subject":"subject under 50 chars","body":"email body with \\n for line breaks","followUp":"2-sentence follow up for 3 days later"}`;

  try {
    const text = await callGemini(prompt);
    return JSON.parse(text);
  } catch (err) {
    console.error('Email generation error:', err.message);
    return { subject: `Quick question about ${businessName}`, body: `Hi ${businessName} team,\n\nI came across your business and think we could help.\n\n${offerDescription?.slice(0,100)}\n\nWould you be open to a quick call?\n\nBest`, followUp: 'Following up on my previous email. Would love to connect if timing works.' };
  }
}

async function enrichLead(leadData, offerDescription) {
  const analysis = await analyzePainPoints(leadData);
  const enriched = { ...leadData, painPoints: analysis.painPoints, aiSummary: analysis.summary, score: analysis.outreachScore };
  let emailData = null;
  if (offerDescription) {
    // Small delay to respect Gemini rate limits
    await new Promise(r => setTimeout(r, 1500));
    emailData = await generatePersonalizedEmail(enriched, offerDescription);
  }
  return { analysis, emailData, enrichedLead: enriched };
}

module.exports = { analyzePainPoints, generatePersonalizedEmail, enrichLead };
