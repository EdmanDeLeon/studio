export default function DebugPage() {
    return (
      <pre>
        {JSON.stringify({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "exists" : "MISSING",
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        }, null, 2)}
      </pre>
    );
  }