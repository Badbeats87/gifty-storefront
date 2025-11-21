// This is a static documentation page and does not require client-side interactivity.

export default function ArchitecturePage() {
  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-black mb-2">System Architecture</h1>
          <p className="text-gray-600">Multi-tenant gift card platform - Technical documentation and infrastructure overview</p>
        </div>

        <div className="bg-white border border-gray-200 p-8">

          {/* Architecture Diagram */}
          <div className="space-y-6 mb-8">
            {/* Main System Overview */}
            <div>
              <h3 className="font-light text-lg mb-2">System Overview</h3>
              <div className="bg-gray-900 text-green-400 p-6 font-mono text-xs overflow-x-auto">
                <pre>{`
╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                                    👥 CUSTOMERS                                               ║
║                              https://yoursite.wixsite.com/gifty                              ║
║                         Browse businesses → Select amount → Checkout                          ║
╚═══════════════════════════════════════════╦═══════════════════════════════════════════════════╝
                                            ║
                                            ║ HTTPS (443)
                                            ║ GET /products
                                            ║ POST /checkout
                                            ║
                                            ▼
╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                            🌐 WIX SITE (Wix Cloud Infrastructure)                            ║
║                                  Hosted on: Wix Edge Network                                  ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                               ║
║  ┌─────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐                ║
║  │   STOREFRONT        │  │   CHECKOUT ENGINE    │  │   VELO RUNTIME      │                ║
║  ├─────────────────────┤  ├──────────────────────┤  ├─────────────────────┤                ║
║  │ • Dynamic products  │  │ • Stripe integration │  │ • Backend code      │                ║
║  │ • Business catalog  │  │ • PayPal integration │  │ • API calls         │                ║
║  │ • Gift card pages   │  │ • Order processing   │  │ • Event handlers    │                ║
║  │ • Responsive design │  │ • Email receipts     │  │ • Data validation   │                ║
║  └─────────────────────┘  └──────────────────────┘  └─────────────────────┘                ║
║                                                                                               ║
║  Database: Wix Data Collections (CMS)                                                        ║
║  CDN: Wix Global CDN (200+ PoPs)                                                             ║
║  SSL: Auto-renewed Let's Encrypt                                                             ║
║                                                                                               ║
╚══════════════════════════════╦════════════════════════════════════════════════════════════════╝
                               ║
                               ║ Webhooks & REST API
                               ║ POST /payment-webhook
                               ║ POST /wix/products (create)
                               ║ Content-Type: application/json
                               ║
                               ▼
╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                        ☁️  SUPABASE BACKEND (Cloud Infrastructure)                           ║
║                        Project: kppdvozuesiycwdacqgf.supabase.co                             ║
║                        Region: US East (AWS us-east-1)                                        ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                               ║
║  ┌───────────────────────────────────── EDGE FUNCTIONS (Deno Runtime) ──────────────────────┐║
║  │                                                                                           │║
║  │  [1] approve-business-application  →  Creates Wix product, 6 variants, $3 fee           │║
║  │      POST /approve-business-application                                                  │║
║  │      Input: { applicationId }                                                            │║
║  │      Output: { wixProductId, business }                                                  │║
║  │                                                                                           │║
║  │  [2] issue-gift-card  →  Generates unique code (GIFT-XXXX-XXXX)                         │║
║  │      POST /issue-gift-card                                                               │║
║  │      Input: { businessId, amount, customerId }                                           │║
║  │      Output: { code, giftCardId }                                                        │║
║  │                                                                                           │║
║  │  [3] redeem-gift-card  →  Validates & decrements balance                                 │║
║  │      POST /redeem-gift-card                                                              │║
║  │      Input: { code, amount }                                                             │║
║  │      Output: { newBalance, transactionId }                                               │║
║  │                                                                                           │║
║  │  [4] validate-gift-card  →  Check code without modifying                                 │║
║  │      GET /validate-gift-card?code=XXXX                                                   │║
║  │      Output: { valid, balance, status, business }                                        │║
║  │                                                                                           │║
║  │  [5] payment-webhook  →  Wix payment events handler                                      │║
║  │      POST /payment-webhook                                                               │║
║  │      Triggers: issue-gift-card (includes email)                                          │║
║  │                                                                                           │║
║  │  [6] send-business-invite  →  Token generation + email                                   │║
║  │      POST /send-business-invite                                                          │║
║  │      Security: JWT token, 7-day expiry                                                   │║
║  │                                                                                           │║
║  │  [7] revoke-business-invite  →  Cancel pending invites                                   │║
║  │      DELETE /revoke-business-invite/{inviteId}                                           │║
║  │                                                                                           │║
║  │  [8] delete-business  →  Cascade delete (DESTRUCTIVE)                                    │║
║  │      DELETE /delete-business/{businessId}                                                │║
║  │      ⚠️  Removes: business + all gift cards + transactions                               │║
║  │                                                                                           │║
║  └───────────────────────────────────────────────────────────────────────────────────────────┘║
║                                                                                               ║
║  ┌────────────────────────── POSTGRESQL DATABASE (v15.1) ────────────────────────────────┐  ║
║  │                                                                                         │  ║
║  │  TABLE: businesses                          TABLE: gift_cards                          │  ║
║  │  ├─ id (uuid, PK)                          ├─ id (uuid, PK)                           │  ║
║  │  ├─ name (text)                            ├─ code (text, unique, indexed)            │  ║
║  │  ├─ slug (text, unique)                    ├─ business_id (uuid, FK)                  │  ║
║  │  ├─ status (enum: active/inactive)         ├─ customer_id (uuid, FK)                  │  ║
║  │  ├─ contact_email (text)                   ├─ amount (decimal)                        │  ║
║  │  ├─ contact_name (text)                    ├─ remaining_balance (decimal)             │  ║
║  │  ├─ iban (text)                            ├─ status (enum: issued/redeemed...)       │  ║
║  │  ├─ wix_product_id (text)                  ├─ expires_at (timestamp)                  │  ║
║  │  ├─ created_at (timestamp)                 ├─ redeemed_at (timestamp)                 │  ║
║  │  └─ RLS: Public read, Admin write          ├─ metadata (jsonb)                        │  ║
║  │                                             └─ RLS: Owner + Admin                      │  ║
║  │  TABLE: business_applications               TABLE: business_invites                    │  ║
║  │  ├─ id (uuid, PK)                          ├─ id (uuid, PK)                           │  ║
║  │  ├─ business_name (text)                   ├─ email (text)                            │  ║
║  │  ├─ contact_email (text)                   ├─ token (text, unique)                    │  ║
║  │  ├─ contact_name (text)                    ├─ status (enum: pending/accepted...)      │  ║
║  │  ├─ phone (text)                           ├─ invited_by (text)                       │  ║
║  │  ├─ iban (text)                            ├─ expires_at (timestamp)                  │  ║
║  │  ├─ status (enum: pending/approved...)     └─ RLS: Admin only                         │  ║
║  │  ├─ submitted_at (timestamp)                                                           │  ║
║  │  └─ RLS: Admin only                        TABLE: customers                            │  ║
║  │                                             ├─ id (uuid, PK)                           │  ║
║  │  Indexes:                                   ├─ email (text, unique)                    │  ║
║  │  • gift_cards_code_idx (B-tree)           ├─ name (text)                             │  ║
║  │  • gift_cards_business_id_idx             ├─ created_at (timestamp)                  │  ║
║  │  • businesses_wix_product_id_idx          └─ RLS: Self + Admin                       │  ║
║  │                                                                                         │  ║
║  │  Connection Pooling: PgBouncer (max 15 connections)                                    │  ║
║  │  Backups: Daily automated (retained 7 days)                                            │  ║
║  │  Replication: Streaming replication (read replicas available)                          │  ║
║  │                                                                                         │  ║
║  └─────────────────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                               ║
║  Security: Row-Level Security (RLS) policies, JWT authentication                             ║
║  Monitoring: Built-in metrics, query performance insights                                    ║
║  API: Auto-generated REST & GraphQL endpoints                                                ║
║                                                                                               ║
╚══════════════════════════════╦════════════════════════════════════════════════════════════════╝
                               ║
                               ║ REST API (HTTPS)
                               ║ Authorization: Bearer {service_role_key}
                               ║ GET /rest/v1/businesses
                               ║ POST /rest/v1/gift_cards
                               ║
                               ▲
╔══════════════════════════════╩════════════════════════════════════════════════════════════════╗
║                       🚀 ADMIN DASHBOARD (Next.js 16.0.3 + React 19)                         ║
║                              Deploy Target: Vercel Edge Network                               ║
║                              Current: localhost:3000 (Development)                            ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                               ║
║  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  ║
║  │   DASHBOARD     │  │   BUSINESSES     │  │   GIFT CARDS     │  │   ARCHITECTURE     │  ║
║  ├─────────────────┤  ├──────────────────┤  ├──────────────────┤  ├─────────────────────┤  ║
║  │ • Gift lookup   │  │ • Applications   │  │ • Search by code │  │ • System diagram   │  ║
║  │ • Quick stats   │  │ • Active list    │  │ • Validate       │  │ • Data flows       │  ║
║  │ • Recent cards  │  │ • Approve/reject │  │ • Redeem         │  │ • Tech stack       │  ║
║  │ • Navigation    │  │ • Send invites   │  │ • View balance   │  │ • Deployment info  │  ║
║  │                 │  │ • Delete (warn)  │  │ • History        │  │                    │  ║
║  └─────────────────┘  └──────────────────┘  └──────────────────┘  └─────────────────────┘  ║
║                                                                                               ║
║  Routes:                                                                                      ║
║  • / (Dashboard)                    • /architecture (Docs)                                   ║
║  • /businesses (Management)         • /register/[token] (Registration)                       ║
║  • /owner/[id]/dashboard (Owner)                                                             ║
║                                                                                               ║
║  Tech: Next.js App Router, Server Components, Tailwind CSS, TypeScript                       ║
║  Auth: Supabase SSR (cookie-based sessions)                                                  ║
║  State: React hooks, no external state management                                            ║
║  Build: Turbopack (dev), Webpack (prod)                                                      ║
║                                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
                                            ▲
                                            ║
                                            ║ HTTPS (Browser)
                                            ║
                               ┌────────────┴────────────┐
                               │     👨‍💼 ADMIN USERS     │
                               │   Platform Management   │
                               │   Business Approvals    │
                               └─────────────────────────┘
            `}</pre>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-blue-50 border-2 border-blue-200 p-4">
              <h4 className="font-bold mb-2">Legend</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌐</span>
                  <span>Wix Cloud</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">☁️</span>
                  <span>Supabase Cloud</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  <span>Vercel (Future)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  <span>End Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-black">║</span>
                  <span>HTTPS Connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-black">▼▲</span>
                  <span>Data Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-600">PK</span>
                  <span>Primary Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-600">FK</span>
                  <span>Foreign Key</span>
                </div>
              </div>
            </div>
          </div>

          {/* Components Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <ComponentCard
              title="🌐 Wix Site"
              subtitle="Customer Storefront"
              status="Hosted on Wix"
              items={[
                'Auto-generated product pages',
                'Gift card checkout flow',
                'Multi-business catalog',
                'Velo backend integration'
              ]}
              tech="Wix Stores API v3 + Velo"
            />

            <ComponentCard
              title="☁️ Supabase Backend"
              subtitle="Business Logic & Data"
              status="Deployed (kppdvozuesiycwdacqgf.supabase.co)"
              items={[
                '9 Edge Functions (active)',
                'PostgreSQL database',
                'Row-level security (RLS)',
                'Real-time subscriptions'
              ]}
              tech="Deno Edge Functions + PostgreSQL"
            />

            <ComponentCard
              title="🚀 Admin Dashboard"
              subtitle="Platform Management"
              status="Deploy to Vercel"
              items={[
                'Business approvals',
                'Gift card management',
                'Invitation system',
                'Analytics & reporting'
              ]}
              tech="Next.js 16 + Tailwind CSS"
            />
          </div>

          {/* Data Flow Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-light mb-4">Key Data Flows</h2>

            <DataFlow
              title="1. Business Approval Flow"
              steps={[
                'Admin reviews application in dashboard',
                'Admin clicks "Approve" button',
                'Dashboard calls approve-business-application function',
                'Function creates Wix product with 6 variants ($25-$150)',
                'Function updates database (status → approved)',
                'Product appears in Wix storefront automatically'
              ]}
            />

            <DataFlow
              title="2. Gift Card Purchase Flow"
              steps={[
                'Customer browses Wix site, selects business',
                'Customer adds gift card to cart, checks out',
                'Wix processes payment via Stripe/PayPal',
                'Wix sends webhook to payment-webhook function',
                'Function calls issue-gift-card to create card + email recipient',
                'Customer receives email with gift card code (Resend)'
              ]}
            />

            <DataFlow
              title="3. Gift Card Redemption Flow"
              steps={[
                'Business owner receives gift card code from customer',
                'Business validates code via Wix interface or API',
                'validate-gift-card function checks code validity',
                'redeem-gift-card function processes redemption',
                'Database updated (balance decremented)',
                'Confirmation returned to business owner'
              ]}
            />
          </section>

          {/* Technology Stack */}
          <section className="mb-8">
            <h2 className="text-2xl font-light mb-4">Technology Stack</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <TechStack
                category="Frontend"
                items={[
                  { name: 'Wix Velo', purpose: 'Customer storefront' },
                  { name: 'Next.js 16', purpose: 'Admin dashboard' },
                  { name: 'React 19', purpose: 'UI components' },
                  { name: 'Tailwind CSS', purpose: 'Styling' }
                ]}
              />
              <TechStack
                category="Backend"
                items={[
                  { name: 'Supabase', purpose: 'Database & functions' },
                  { name: 'PostgreSQL', purpose: 'Data storage' },
                  { name: 'Deno', purpose: 'Edge runtime' },
                  { name: 'Wix API v3', purpose: 'Product creation' }
                ]}
              />
              <TechStack
                category="Services"
                items={[
                  { name: 'Wix Stores', purpose: 'E-commerce platform' },
                  { name: 'Resend', purpose: 'Email delivery' },
                  { name: 'Stripe/PayPal', purpose: 'Payment processing' },
                  { name: 'Vercel', purpose: 'Admin dashboard hosting' }
                ]}
              />
              <TechStack
                category="Development"
                items={[
                  { name: 'TypeScript', purpose: 'Type safety' },
                  { name: 'Git/GitHub', purpose: 'Version control' },
                  { name: 'Supabase CLI', purpose: 'Deployment' },
                  { name: 'Wix CLI', purpose: 'Local development' }
                ]}
              />
            </div>
          </section>

          {/* Deployment Info */}
          <section className="bg-blue-50 border border-blue-200 p-6">
            <h2 className="text-2xl font-light mb-4">Deployment Status</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <DeploymentStatus
                component="Supabase Backend"
                status="live"
                url="kppdvozuesiycwdacqgf.supabase.co"
                details="9 functions deployed"
              />
              <DeploymentStatus
                component="Wix Site"
                status="pending"
                url="yoursite.wixsite.com/gifty"
                details="Awaiting subscription"
              />
              <DeploymentStatus
                component="Admin Dashboard"
                status="local"
                url="localhost:3000"
                details="Deploy to Vercel"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ComponentCard({ title, subtitle, status, items, tech }: {
  title: string;
  subtitle: string;
  status: string;
  items: string[];
  tech: string;
}) {
  return (
    <div className="border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-2">{subtitle}</p>
      <p className="text-xs font-semibold text-black mb-4">{status}</p>
      <ul className="space-y-2 mb-4">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            {item}
          </li>
        ))}
      </ul>
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 font-mono">{tech}</p>
      </div>
    </div>
  );
}

function DataFlow({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="mb-6 border-l-4 border-blue-500 pl-4">
      <h3 className="font-bold mb-3">{title}</h3>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="text-sm text-gray-700 flex">
            <span className="font-bold text-black mr-3 min-w-[2rem]">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TechStack({ category, items }: {
  category: string;
  items: { name: string; purpose: string }[];
}) {
  return (
    <div className="border border-gray-200 p-4">
      <h3 className="font-light mb-3 text-lg">{category}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm">
            <span className="font-semibold text-gray-800">{item.name}</span>
            <span className="text-gray-500"> — {item.purpose}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeploymentStatus({ component, status, url, details }: {
  component: string;
  status: 'live' | 'pending' | 'local';
  url: string;
  details: string;
}) {
  const statusColors = {
    live: 'bg-gray-100 text-gray-800',
    pending: 'bg-gray-100 text-gray-800',
    local: 'bg-gray-100 text-gray-800'
  };

  const statusIcons = {
    live: '🟢',
    pending: '🟡',
    local: '⚪'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">{component}</h4>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[status]}`}>
          {statusIcons[status]} {status.toUpperCase()}
        </span>
      </div>
      <p className="text-xs font-mono text-gray-600 mb-1">{url}</p>
      <p className="text-xs text-gray-500">{details}</p>
    </div>
  );
}
