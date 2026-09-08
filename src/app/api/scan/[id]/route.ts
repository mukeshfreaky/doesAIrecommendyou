import { NextRequest, NextResponse } from "next/server";
import { getScanReport } from "@/lib/scanStorage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Scan ID is required" }, { status: 400 });
  }

  const report = getScanReport(id);
  if (!report) {
    return NextResponse.json({ error: "Scan report not found or expired" }, { status: 404 });
  }

  return NextResponse.json(report, { status: 200 });
}
