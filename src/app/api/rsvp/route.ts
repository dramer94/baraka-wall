import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client at runtime
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables not configured");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// GET - Fetch all RSVPs (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    // Verify admin password for fetching all RSVPs
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("rsvp")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      attending: data?.filter((r) => r.attendance === "attending").length || 0,
      notAttending: data?.filter((r) => r.attendance === "not_attending").length || 0,
      maybe: data?.filter((r) => r.attendance === "maybe").length || 0,
      totalGuests: data?.reduce((sum, r) => sum + (r.attendance === "attending" ? r.guest_count : 0), 0) || 0,
    };

    return NextResponse.json({ rsvps: data || [], stats });
  } catch (error) {
    console.error("Error fetching RSVPs:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch RSVPs", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Submit new RSVP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guest_name, email, phone, attendance, guest_count, dietary_restrictions, message } = body;

    // Validation
    if (!guest_name || !attendance) {
      return NextResponse.json(
        { error: "Guest name and attendance status are required" },
        { status: 400 }
      );
    }

    if (!["attending", "not_attending", "maybe"].includes(attendance)) {
      return NextResponse.json(
        { error: "Invalid attendance status" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("rsvp")
      .insert({
        guest_name,
        email: email || null,
        phone: phone || null,
        attendance,
        guest_count: attendance === "attending" ? (guest_count || 1) : 0,
        dietary_restrictions: dietary_restrictions || null,
        message: message || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, rsvp: data });
  } catch (error) {
    console.error("Error submitting RSVP:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to submit RSVP", details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Delete an RSVP (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");
    const id = searchParams.get("id");

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "RSVP ID required" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("rsvp").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting RSVP:", error);
    return NextResponse.json(
      { error: "Failed to delete RSVP" },
      { status: 500 }
    );
  }
}
