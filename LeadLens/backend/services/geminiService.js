// services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;

function getGeminiClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Analyze business reviews to extract pain points and opportunities
 */
async function analyzePainPoints(businessData) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const { businessName, category, reviews = [], rating } = businessData;

  const reviewText = reviews.length > 0
    ? reviews.slice(0, 20).map((r, i) => `Review ${i + 1} (${r.rating}/5): "${r.text}"`).join('\n')
    : 'No reviews available';

  const prompt = `You are a B2B sales intelligence expert analyzing a business for outreach opportunities.

Business: ${businessName}
Industry: ${category}
Average Rating: ${rating}/5 stars

Customer Reviews:
${reviewText}

Analyze this business and provide a JSON response with EXACTLY this structure (no markdown, pure JSON):
{
  "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "businessHealth": "struggling|average|thriving",
  "outreachScore": 75,
  "summary": "2-3 sentence business intelligence summary",
  "keyInsight": "single most actionable insight for a salesperson"
}

Rules:
- outreachScore is 1-100 (higher = better prospect, 70+ means actively struggling)
- painPoints should be specific and actionable (from reviews if available, inferred from industry if not)
- Keep all text under 100 words per field
- Return ONLY valid JSON, no explanation`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini pain point analysis error:', err.message);
    return {
      painPoints: ['Unable to analyze at this time'],
      opportunities: ['General business improvement'],
      businessHealth: 'unknown',
      outreachScore: 50,
      summary: `${businessName} is a ${category} business.`,
      keyInsight: 'Review their online presence for outreach angles.'
    };
  }
}

/**
 * Generate a hyper-personalized cold email
 */
async function generatePersonalizedEmail(businessData, offerDescription) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const { businessName, category, city, painPoints = [], keyInsight = '', rating, reviewCount } = businessData;

  const prompt = `You are an expert cold email copywriter who writes emails that get responses.

TARGET BUSINESS:
- Name: ${businessName}
- Industry: ${category}
- Location: ${city || 'their area'}
- Rating: ${rating}/5 (${reviewCount} reviews)
- Key Pain Point: ${painPoints[0] || 'operational challenges'}
- Business Insight: ${keyInsight}

YOUR OFFER:
${offerDescription}

Write a cold email that:
1. Opens with a hyper-specific observation about THEIR business (mention their name, rating, or a real pain point)
2. Connects their pain to your offer naturally (do not be salesy)
3. Has a clear, low-friction call to action
4. Feels like it was written by a human who did their homework
5. Is under 150 words total

Return ONLY valid JSON with this structure:
{
  "subject": "compelling subject line under 50 chars",
  "body": "full email body with line breaks as \\n",
  "followUp": "a 2-sentence follow up email for 3 days later"
}

Important: Do NOT use hyphens in the email text. Use em dashes (—) or restructure sentences instead.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini email generation error:', err.message);
    return {
      subject: `Quick question about ${businessName}`,
      body: `Hi ${businessName} team,\n\nI came across your business and noticed an opportunity that might interest you.\n\n${offerDescription}\n\nWould you be open to a quick 15-minute call this week?\n\nBest regards`,
      followUp: `Just following up on my previous email. Would love to connect if the timing works for you.`
    };
  }
}

/**
 * Generate batch emails for multiple leads
 */
async function generateBatchEmails(leads, offerDescription, onProgress) {
  const results = [];

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    try {
      const emailData = await generatePersonalizedEmail(lead, offerDescription);
      results.push({ leadId: lead.id, ...emailData, success: true });
    } catch (err) {
      results.push({ leadId: lead.id, success: false, error: err.message });
    }

    if (onProgress) onProgress(i + 1, leads.length);

    // Respect Gemini rate limits (free tier: 15 requests/min)
    if (i < leads.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return results;
}

/**
 * Enrich lead with full AI analysis
 */
async function enrichLead(leadData, offerDescription) {
  const analysis = await analyzePainPoints(leadData);

  const enrichedData = {
    ...leadData,
    painPoints: analysis.painPoints,
    aiSummary: analysis.summary,
    score: analysis.outreachScore,
    businessHealth: analysis.businessHealth,
    keyInsight: analysis.keyInsight,
    opportunities: analysis.opportunities
  };

  let emailData = null;
  if (offerDescription) {
    emailData = await generatePersonalizedEmail(enrichedData, offerDescription);
  }

  return {
    analysis,
    emailData,
    enrichedLead: enrichedData
  };
}

module.exports = {
  analyzePainPoints,
  generatePersonalizedEmail,
  generateBatchEmails,
  enrichLead
};
