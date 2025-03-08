import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET() {
  try {
    // Create Supabase admin client
    const supabase = createAdminSupabase();

    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Fetch new businesses from the last 24 hours
    const { data: newBusinesses, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .gte("created_at", yesterday.toISOString())
      .order("created_at", { ascending: false });

    if (businessError) {
      console.error("Error fetching new businesses:", businessError);
      return NextResponse.json(
        { error: "Failed to fetch new businesses" },
        { status: 500 },
      );
    }

    if (newBusinesses && newBusinesses.length > 0) {
      // Get user emails
      const { data: users, error: usersError } =
        await supabase.auth.admin.listUsers();

      if (usersError) {
        console.error("Error fetching users:", usersError);
        return NextResponse.json(
          { error: "Failed to fetch users" },
          { status: 500 },
        );
      }

      // Match business IDs with user emails
      const businessEmails = newBusinesses
        .map((business) => {
          const user = users.users.find((u) => u.id === business.id);
          return user?.email;
        })
        .filter(Boolean);

      if (businessEmails.length > 0) {
        await resend.emails.send({
          from: "Eventer Watcher <support@fair-chat.com>",
          to: ["timurjan.kramar123@gmail.com"],
          subject: `${newBusinesses.length} New User${newBusinesses.length > 1 ? "s" : ""} in the Last 24 Hours`,
          html: `
            <h2>New Users Report</h2>
            <p>There ${newBusinesses.length === 1 ? "is" : "are"} ${newBusinesses.length} new user${newBusinesses.length > 1 ? "s" : ""} in the last 24 hours.</p>
            <p>Email addresses: ${businessEmails.join(", ")}</p>
          `,
        });
      }
    }

    return NextResponse.json({
      success: true,
      newUsersCount: newBusinesses?.length || 0,
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
