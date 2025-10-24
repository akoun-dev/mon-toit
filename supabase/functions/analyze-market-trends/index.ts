import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, contenttype',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders
      })
    }

    const body = await req.json()

    // Mock market trends data
    const marketTrends = {
      summary: {
        average_rent: 180000,
        properties_count: 156,
        popular_neighborhoods: ['Cocody', 'Plateau', 'Marcory', 'Yopougon'],
        price_trend: 'stable',
        demand_level: 'high'
      },
      monthly_trends: [
        { month: '2025-01', average_rent: 175000, properties_count: 145 },
        { month: '2025-02', average_rent: 178000, properties_count: 152 },
        { month: '2025-03', average_rent: 180000, properties_count: 156 },
        { month: '2025-04', average_rent: 182000, properties_count: 161 },
        { month: '2025-05', average_rent: 181000, properties_count: 158 },
        { month: '2025-06', average_rent: 180000, properties_count: 156 }
      ],
      neighborhood_stats: [
        {
          neighborhood: 'Cocody',
          average_rent: 350000,
          properties_count: 45,
          price_trend: 'increasing'
        },
        {
          neighborhood: 'Plateau',
          average_rent: 420000,
          properties_count: 28,
          price_trend: 'stable'
        },
        {
          neighborhood: 'Marcory',
          average_rent: 150000,
          properties_count: 38,
          price_trend: 'stable'
        },
        {
          neighborhood: 'Yopougon',
          average_rent: 85000,
          properties_count: 45,
          price_trend: 'decreasing'
        }
      ],
      recommendations: [
        {
          type: 'investment',
          area: 'Yopougon',
          reason: 'Prix abordables en hausse, bon potentiel de rendement'
        },
        {
          type: 'search',
          area: 'Cocody',
          reason: 'Zone stable avec forte demande locative'
        }
      ]
    }

    return new Response(JSON.stringify(marketTrends), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})