# Deployment Guide for Google Cloud Run

This guide explains how to deploy the Notemate Backend to Google Cloud Run.

## Prerequisites

1.  Google Cloud SDK (`gcloud`) installed and authenticated.
2.  A Google Cloud Project with billing enabled.
3.  APIs enabled:
    *   Cloud Run API
    *   Cloud Build API
    *   Artifact Registry API

## Configuration

The application requires several environment variables. You should configure these in Cloud Run.

### Environment Variables

*   `FIREBASE_PROJECT_ID`
*   `FIREBASE_CLIENT_EMAIL`
*   `FIREBASE_PRIVATE_KEY` (Note: Handle newlines correctly)
*   `ASSEMBLYAI_API_KEY`
*   `GEMINI_API_KEY`
*   `FILEBASE_KEY`
*   `FILEBASE_SECRET`
*   `FILEBASE_BUCKET`
*   `WEBHOOK_BASE_URL` (This should be the URL of your Cloud Run service after first deployment, or a custom domain)
*   `WEBHOOK_SECRET`

## Deployment Steps

1.  **Login to Google Cloud:**

    ```bash
    gcloud auth login
    gcloud config set project [YOUR_PROJECT_ID]
    ```

2.  **Deploy to Cloud Run:**

    Run the following command to build and deploy. Replace `[SERVICE_NAME]` (e.g., `notemate-backend`) and `[REGION]` (e.g., `us-central1`).

    ```bash
    gcloud run deploy [SERVICE_NAME] \
      --source . \
      --region [REGION] \
      --allow-unauthenticated \
      --min-instances 1 \
      --max-instances 10 \
      --port 3000
    ```

    **Important Flags:**
    *   `--source .`: Builds the container from the current directory (using the Dockerfile).
    *   `--min-instances 1`: **CRITICAL**. Keeps at least one instance running to ensure the background job processor (Cron) continues to run even when there are no HTTP requests.
    *   `--allow-unauthenticated`: Allows public access (needed for Webhooks and API access).

3.  **Set Environment Variables:**

    You can set environment variables during deployment or update them later.

    ```bash
    gcloud run services update [SERVICE_NAME] \
      --region [REGION] \
      --set-env-vars "FIREBASE_PROJECT_ID=...,ASSEMBLYAI_API_KEY=..."
    ```

    *Tip: For sensitive keys like `FIREBASE_PRIVATE_KEY`, consider using Google Cloud Secret Manager.*

4.  **Update Webhook URL:**

    After deployment, get the Service URL (e.g., `https://notemate-backend-xyz.a.run.app`).
    Update the `WEBHOOK_BASE_URL` environment variable to this URL.

    ```bash
    gcloud run services update [SERVICE_NAME] \
      --region [REGION] \
      --set-env-vars "WEBHOOK_BASE_URL=https://notemate-backend-xyz.a.run.app"
    ```

## Concurrency & Limits

The application is configured to process up to **5 concurrent jobs** per instance.
*   The `JobProcessorService` runs every minute.
*   It atomically claims jobs from Firestore to prevent race conditions.
*   `--min-instances 1` ensures the processor is always active.
