# 🐺 Wolf Pack Coaching Dashboards

## 🚀 Railway Deployment

Real-time coaching pipeline dashboards with Supabase integration for instant cross-coach synchronization.

### 📊 Dashboards

- **`/`** - Coaching Hub (Navigation center)
- **`/pipeline/`** - Student Pipeline Tracking (Main dashboard)
- **`/coaches/`** - Performance Analytics

### ⚡ Features

- **Real-time sync** between all coaches (< 100ms)
- **Hybrid Airtable + Supabase** data management
- **Mobile-responsive** design
- **24/7 uptime** with Railway hosting

### 🗄️ Database Architecture

```
Airtable (Master DB) ←→ Supabase (Real-time Cache) ←→ All Dashboards
```

**Data Flow:**
1. Coach makes change → Supabase (instant UI update)
2. Supabase → Airtable (master record)
3. Supabase broadcasts → All other coaches (real-time)

### 🔧 Environment Variables

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
AIRTABLE_BASE_ID=appFR2ovH2m5XN6I3
AIRTABLE_TOKEN=your-token
```

### 🚀 Deployment

```bash
# Deploy to Railway
railway login
railway link
railway up
```

### 👥 Team Access

All Wolf Pack coaches can access:
- Maurice, Eray, Nabil, Dilano, Lorenzo, Melvin

### 🎯 Migration from Ngrok

✅ **Migrated Components:**
- Coaching Hub navigation
- Full pipeline with 14 stages
- Coaches performance dashboard
- All student data preserved
- Airtable integration maintained

✅ **New Features:**
- Sub-second real-time sync
- 99.9% uptime guarantee
- Professional SSL URL
- Mobile optimization

---

**Built for Wolf Pack Team Performance 🐺**