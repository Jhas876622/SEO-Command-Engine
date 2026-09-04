# SEO Command Center — Public Deployment Guide

This guide explains how to deploy and showcase your **SEO Command Center** publicly so anyone can view the dashboard and run audits online.

---

## Option 1: Instant Local Sharing (1-Minute Setup) ⚡ Recommended for Quick Demos

If you are running the dashboard locally (`python mcp/server.py` or `python run.py ...`), you can expose a public URL in seconds using `localtunnel` or `ngrok`.

### Using localtunnel (No Account Required)
```bash
# 1. Start the server
python mcp/server.py

# 2. In a second terminal window, run localtunnel
npx localtunnel --port 7700
```
- It will give you a public URL (e.g. `https://quiet-snake-42.loca.lt`).
- Anyone with the link can open the dashboard, watch live audits, and upload CSV exports!

### Using ngrok
```bash
ngrok http 7700
```

---

## Option 2: Docker Container Deployment 🐳

You can build and launch the application as a standalone container on any server (VPS, AWS, DigitalOcean, Hetzner, etc.):

```bash
# Build and run using Docker Compose
docker-compose up -d --build
```
Access the dashboard at `http://<your-server-ip>:7700`.

---

## Option 3: Free Cloud Hosting (Render / Railway / Fly.io) ☁️

### Deploying on Render.com (Free Tier)
1. Push your repository to GitHub.
2. Log into [Render.com](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Select Environment: **Docker**.
5. Set Port: `7700`.
6. Click **Deploy Web Service**.
7. Render will build the container and provide a permanent HTTPS URL (`https://seo-command-center.onrender.com`).

---

## 🎯 How Users Interact With Your Showcase

Once your app is live:
1. Anyone opens the public URL.
2. They see the real-time **SEO Command Center Cockpit**.
3. They can click **"📁 Upload CSV Export"** in the top right corner and upload any Screaming Frog CSV file (`internal_all.csv`).
4. The dashboard immediately processes the audit with real-time SSE progress indicators, health scores, and client deliverable reports!
