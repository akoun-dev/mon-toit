import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

type SeedUser = {
  email: string
  password: string
  full_name: string
  user_type: 'locataire' | 'proprietaire' | 'agence' | 'admin'
}

const USERS: SeedUser[] = [
  { email: 'locataire@mon-toit.ci', password: 'locataire123', full_name: 'Locataire Mon Toit', user_type: 'locataire' },
  { email: 'proprietaire@mon-toit.ci', password: 'proprietaire123', full_name: 'Propriétaire Mon Toit', user_type: 'proprietaire' },
  { email: 'agence@mon-toit.ci', password: 'agence123', full_name: 'Agence Mon Toit', user_type: 'agence' },
  { email: 'admin@mon-toit.ci', password: 'admin123', full_name: 'Admin Mon Toit', user_type: 'admin' },
]

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY in environment. Aborting.')
    process.exit(1)
  }

  const admin = createClient(url, serviceRoleKey)

  for (const u of USERS) {
    try {
      // Check if exists
      const { data: existing, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
      if (listErr) throw listErr
      const already = existing.users.find(x => x.email?.toLowerCase() === u.email.toLowerCase())
      if (already) {
        console.log(`✓ Exists: ${u.email}`)
        continue
      }

      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
          user_type: u.user_type,
        },
      })

      if (error) throw error
      console.log(`✓ Created: ${u.email} (${data.user?.id})`)
    } catch (e: any) {
      console.error(`✗ Failed: ${u.email} -> ${e?.message || e}`)
    }
  }

  console.log('\nSeed complete.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

