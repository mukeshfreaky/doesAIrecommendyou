import { NextResponse } from "next/server";
import { getAllSupportedProviders } from "@/providers/registry";

export async function GET() {
  const providers = getAllSupportedProviders();
  const hasConfiguredProvider = providers.some((p) => p.isConfigured);

  return NextResponse.json({
    status: "ok",
    version: "1.0.0-phase1",
    timestamp: new Date().toISOString(),
    providers,
    readyForLiveScan: hasConfiguredProvider,
  });
}
