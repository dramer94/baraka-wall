# Wedding Memory Wall

A beautiful digital guestbook where wedding guests can scan a QR code, take photos, and leave heartfelt messages. All memories display on a shared live gallery perfect for projecting at your venue.

## Features

- **Guest Submission Page** (`/submit`) - Mobile-first design for easy photo capture and message submission
- **Live Gallery Wall** (`/wall`) - Real-time updates with beautiful masonry layout, perfect for venue display
- **Admin Dashboard** (`/admin`) - Password-protected management, delete inappropriate content, download photos
- **QR Code Generator** (`/qr-generator`) - Create printable QR codes for each table

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Database + Real-time) - Free tier
- Cloudinary (Image Storage) - 25GB free
- Deployed on Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd wedding-memory-wall
npm install
```

### 2. Set Up Cloudinary (Image Storage - 25GB Free)

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Go to your **Dashboard**
3. Copy these values:
   - Cloud Name
   - API Key
   - API Secret

### 3. Set Up Supabase (Database - Free Tier)

1. Create a new project at [supabase.com](https://supabase.com)

2. Go to **SQL Editor** and run this SQL to create the submissions table:

```sql
-- Create submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT,
  message TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  table_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON submissions
  FOR SELECT USING (true);

-- Create policy to allow public insert
CREATE POLICY "Allow public insert" ON submissions
  FOR INSERT WITH CHECK (true);

-- Create policy to allow public delete (for admin)
CREATE POLICY "Allow public delete" ON submissions
  FOR DELETE USING (true);

-- Enable real-time for the submissions table
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;

-- Create settings table (for background music, etc.)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings
CREATE POLICY "Allow public read access" ON settings
  FOR SELECT USING (true);

-- Allow public upsert for settings (admin will use password auth via API)
CREATE POLICY "Allow public upsert" ON settings
  FOR ALL USING (true);
```

3. Get your API keys:
   - Go to **Settings** > **API**
   - Copy your `Project URL` and `anon public` key

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Supabase Configuration (Database only)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudinary Configuration (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin Password (for /admin page)
ADMIN_PASSWORD=your-secure-password

# Wedding Details
NEXT_PUBLIC_COUPLE_NAMES="Sarah & Michael"
NEXT_PUBLIC_WEDDING_DATE="January 15, 2026"
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_COUPLE_NAMES` (optional)
   - `NEXT_PUBLIC_WEDDING_DATE` (optional)
4. Deploy!

## Free Tier Capacity

| Service | Free Limit | Capacity |
|---------|-----------|----------|
| Cloudinary | 25 GB storage | ~12,500+ photos |
| Supabase | 500 MB database | Unlimited text submissions |
| Supabase | 5 GB bandwidth | Plenty for real-time |
| Vercel | 100 GB bandwidth | Plenty for wedding |

**Perfect for weddings with 300+ guests!**

## Pages Overview

### Home (`/`)
Landing page with links to submit memories and view the wall.

### Submit (`/submit`)
- Camera access for taking photos (or upload from gallery)
- Message input (max 500 characters)
- Optional guest name
- Optional table number (can be pre-filled via URL: `/submit?table=5`)

### Memory Wall (`/wall`)
- Displays all submitted photos and messages
- Real-time updates (new submissions appear automatically)
- Filter by table number
- Click any card for full-screen view
- Perfect for projecting at the venue

### Admin (`/admin`)
- Password protected
- View all submissions with details
- Delete inappropriate content
- Download all photos
- View submission statistics
- **Background Music Control** - Enable/disable and set music URL for the wall page

### QR Generator (`/qr-generator`)
- Generate QR codes for each table
- Print-ready format with elegant design
- Batch download as PNG files
- Each QR code links to `/submit?table=N`

## QR Code Setup for Your Venue

1. Go to `/qr-generator` on your deployed site
2. Set the number of tables at your venue
3. Select the tables you need QR codes for
4. Click "Print" to print cards, or "Download" to save images
5. Place one QR code at each table

## Customization

### Colors & Theme
Edit the CSS variables in `src/app/globals.css`:

```css
:root {
  --background: #FFF9F5;
  --foreground: #3D3D3D;
  --blush: #F8E1E4;
  --blush-dark: #E8B4B8;
  --gold: #C9A959;
  --gold-dark: #A68A3E;
  --cream: #FAF7F2;
  --sage: #9CAF88;
}
```

### Fonts
Currently using:
- **Playfair Display** - Headers (elegant, serif)
- **Lato** - Body text (clean, sans-serif)

Change fonts in `src/app/globals.css` by updating the Google Fonts import.

## License

MIT License - Feel free to use for your wedding!

---

Made with love for DR MUHAMMAD FAIRUZ BIN ZAKARIA & DR KHAIRIN SYAZWANI ABDUL RAHMAN
