import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";
import { isAdminRequest } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cloudinary = getCloudinary();
  if (!cloudinary) return NextResponse.json({ error: "Image uploads are not configured." }, { status: 503 });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder: "333am/designs" }, process.env.CLOUDINARY_API_SECRET!);
  return NextResponse.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: "333am/designs"
  });
}
