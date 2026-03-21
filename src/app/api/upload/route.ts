import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const name = formData.get("name") as string;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const filename = name || file.name;
  const dir = path.join(process.cwd(), "public/images/projects");
  await mkdir(dir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(path.join(dir, filename), buffer);

  return NextResponse.json({ path: `/images/projects/${filename}` });
}
