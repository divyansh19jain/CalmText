# CalmText Deployment Guide

This guide explains how to deploy the **CalmText API** and **Web UI** as independent services from your single repository.

## 1. Backend: Render (FastAPI)

We have updated the `render.yaml` to ensure it only builds and runs the API.

### **Steps for Render Deployment:**
1.  Create a new **Web Service** on Render.
2.  Connect your GitHub repository.
3.  Render will automatically detect the `render.yaml` and configure the service.
4.  **Important Environment Variables**:
    *   `OPENAI_API_KEY`: Your API key.
    *   `MODEL_PROVIDER`: Set to `openai` (or `claude`).
    *   `CORS_ORIGINS`: Set to your **Vercel frontend URL** (e.g., `https://calmtext.vercel.app`) or `*` for testing.

---

## 2. Frontend: Vercel (React + Vite)

We have updated the frontend to look for a `VITE_API_URL` environment variable.

### **Steps for Vercel Deployment:**
1.  Create a new project in **Vercel**.
2.  Connect the same repository.
3.  In the **Project Settings**:
    *   **Root Directory**: Set to `apps/web`.
    *   **Framework Preset**: Select `Vite`.
4.  **Environment Variables**:
    *   Add a new variable: `VITE_API_URL`.
    *   Value: `https://your-backend-url.onrender.com/api/v1` (The URL of your Render service).

---

## 3. Post-Deployment Check

1.  **CORS**: Ensure your Render service allows your Vercel URL.
2.  **API Path**: Confirm the `/api/v1` suffix is included in your `VITE_API_URL`.

> [!TIP]
> This "one-repo, two-deployments" strategy gives you the best of both worlds: a single codebase with specialized hosting for each component.
