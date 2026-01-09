import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    
    // {
      "accountAssociation": {
        "header": "eyJmaWQiOjk0NzYzMSwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDJiYUExRjdmYkQ0MjFjNkVjMDM1RDljQjY3MjVFNTM2YkZjQUVjZTQifQ",
        "payload": "eyJkb21haW4iOiJiYXNlLWNvdW50ZXItb25lLnZlcmNlbC5hcHAifQ",
        "signature": "dpoAWo02S+1FNjTX35rWnSYB5NGtByYX/wQ+I+0CD2hTNwRtaya9azYDQVlQ+4ComzAXGMKs0o2AOJQWZUTsnxs="
      }
    // }
    ,
    // TODO: Add your own account association
    frame: {
      version: "1",
      name: "Base Counter",
      iconUrl: `${APP_URL}/images/icon.jpg`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.jpg`,
      screenshotUrls: [],
      tags: ["base", "farcaster", "miniapp","game"],
      primaryCategory: "games",
      buttonTitle: "Pull the Lever 🎰",
      splashImageUrl: `${APP_URL}/images/splash.jpg`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
