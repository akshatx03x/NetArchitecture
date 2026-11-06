# NetArchitect: Vercel Deployment Instructions

**Target Platform:** Vercel (Edge & Serverless Node.js Runtime)  
**Deployment Model:** Direct GitHub Continuous Integration / Deployment  
**External Database Dependencies:** None (Zero DB requirement)  
**External API Key Dependencies:** None (Zero paid API dependencies)  

---

## 1. Non-Negotiable Technology Architecture

NetArchitect was specifically engineered to run as a 100% self-contained application directly on Vercel without requiring:
- No separately hosted Node.js / Express / Django / Flask backend.
- No MongoDB, PostgreSQL, Supabase, or Firebase database connections.
- No Docker containers or VPS infrastructure.
- No paid third-party AI or network simulation APIs.

All network calculations, VLSM bitwise arithmetic, and Cisco configuration generation execute locally via deterministic JavaScript modules and Next.js Route Handlers.

---

## 2. Step-by-Step Deployment Procedure

### Option A: Deploy via Vercel Web Dashboard (Recommended)

1. **Commit and Push Repository:**
   Ensure all changes are committed to your GitHub repository:
   ```bash
   git add .
   git commit -m "Complete NetArchitect application"
   git push origin main
   ```

2. **Access Vercel:**
   Log in to your [Vercel Dashboard](https://vercel.com).

3. **Import Git Repository:**
   - Click **"Add New Project"** &rarr; **"Project"**.
   - Select your Git provider (GitHub) and search for the `NetArchitect` repository.
   - Click **"Import"**.

4. **Configure Project Settings:**
   - **Project Name:** `netarchitect` (or your preferred name).
   - **Framework Preset:** Select **Next.js** (detected automatically).
   - **Root Directory:** `./` (default).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `.next` (default).
   - **Install Command:** `npm install` (default).
   - **Environment Variables:** **Leave completely empty** (no API keys or database URLs needed).

5. **Deploy:**
   - Click **"Deploy"**.
   - Vercel will run `npm run build`, generate static pages, compile the serverless route handler (`/api/plan`), and provision the edge CDN.
   - The build completes in approximately 40–50 seconds.

---

### Option B: Deploy via Vercel CLI

If you have the Vercel CLI installed locally:

```bash
# 1. Login to Vercel
vercel login

# 2. Deploy preview build
vercel

# 3. Deploy to production
vercel --prod
```

---

## 3. Post-Deployment Verification Checklist

Once deployed to your Vercel URL (e.g., `https://netarchitect.vercel.app`):

1. **Preset Scenarios:**
   - Test clicking **Campus LAN**, **Metro MAN**, and **Global WAN**.
   - Verify that the Architecture Dashboard, Subnet Table, and Cisco Configs update instantly.
2. **Custom Scenario Builder:**
   - Navigate to the **Scenario Builder**, enter custom host requirements, and click **"Save & Apply Architecture"**.
   - Verify that non-overlapping subnets are created and displayed.
3. **ZIP Configuration Download:**
   - Click **"Export ZIP"** on the navbar or **"Download All as ZIP"** in the Cisco Config Center.
   - Verify that your browser downloads a valid `.zip` archive containing the `.cfg` files, CSV subnet matrix, and Markdown ADR.
4. **Validation Test Suite:**
   - Navigate to **"Validation Tests"** and click **"Re-Run All Validation Tests"**.
   - Verify that all assertions display green PASS status badges.
5. **API Route Verification:**
   - Test the serverless endpoint by sending a curl request:
     ```bash
     curl -X POST https://<your-vercel-domain>/api/plan \
       -H "Content-Type: application/json" \
       -d '{"name":"API Test","networkType":"Campus LAN","distanceMeters":80,"endpoints":100,"rootCidr":"192.168.1.0/24","departments":[{"name":"Dept1","hosts":50}]}'
     ```
   - Verify HTTP 200 response with calculated JSON architecture data.

