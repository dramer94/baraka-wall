import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface MusicSettingsValue {
  enabled?: boolean;
  url?: string;
  title?: string;
}

// GET - Fetch current music settings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "background_music")
      .single();

    // PGRST116 = no rows found, PGRST205 = table not found - both are fine
    if (error && error.code !== "PGRST116" && error.code !== "PGRST205") {
      throw error;
    }

    const value = data?.value as MusicSettingsValue | null;

    return NextResponse.json({
      enabled: value?.enabled ?? false,
      url: value?.url ?? "",
      title: value?.title ?? "",
    });
  } catch (error) {
    console.error("Error fetching music settings:", error);
    return NextResponse.json({
      enabled: false,
      url: "",
      title: "",
    });
  }
}

// POST - Update music settings (requires admin auth)
export async function POST(request: NextRequest) {
  try {
    // Verify admin password
    const { password, enabled, url, title } = await request.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.from("settings").upsert(
      {
        key: "background_music",
        value: { enabled, url, title },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating music settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
