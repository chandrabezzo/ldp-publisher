import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData: ContactFormData = await req.json();
    const { name, email, phone, subject, message } = formData;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save message to database
    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert({
        name,
        email,
        phone: phone || null,
        subject,
        message,
        is_read: false,
      });

    if (dbError) {
      console.error("Failed to save message to database:", dbError);
      // Continue with email sending even if DB save fails
    } else {
      console.log("Message saved to database successfully");
    }

    const targetEmail = "diosaputrawahid@gmail.com";
    
    // Create notification email content for admin
    const notificationContent = `
Pesan Baru dari Website LDP Publisher

Dari: ${name}
Email: ${email}
Telepon: ${phone || "Tidak disertakan"}
Subjek: ${subject}

Pesan:
${message}

---
Pesan ini dikirim dari form kontak website LDP Publisher
    `.trim();

    // Create confirmation email content for sender
    const confirmationHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LDP Publisher</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    <h2 style="color: #1e3a5f; margin-top: 0;">Terima Kasih, ${name}!</h2>
    
    <p>Kami telah menerima pesan Anda dan akan segera menghubungi Anda.</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #1e3a5f; margin-top: 0; font-size: 16px;">Ringkasan Pesan Anda:</h3>
      <p style="margin: 5px 0;"><strong>Subjek:</strong> ${subject}</p>
      <p style="margin: 5px 0;"><strong>Pesan:</strong></p>
      <p style="margin: 5px 0; white-space: pre-wrap; color: #555;">${message}</p>
    </div>
    
    <p>Tim kami biasanya merespons dalam waktu 1-2 hari kerja.</p>
    
    <p style="margin-top: 30px;">Salam hangat,<br><strong>Tim LDP Publisher</strong></p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; color: #666;">
    <p style="margin: 5px 0;">LDP Publisher</p>
    <p style="margin: 5px 0;">5H3J+GW Cigugur Girang, Kabupaten Bandung Barat, Jawa Barat</p>
    <p style="margin: 5px 0;">
      <a href="https://wa.me/6281234567890" style="color: #1e3a5f; text-decoration: none;">WhatsApp</a> | 
      <a href="mailto:diosaputrawahid@gmail.com" style="color: #1e3a5f; text-decoration: none;">Email</a>
    </p>
  </div>
</body>
</html>
    `.trim();

    // Log minimal metadata (privacy-conscious)
    console.log("Contact form submission received", {
      to: targetEmail,
      subject,
      hasPhone: !!phone,
      messageLength: message?.length ?? 0,
    });

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notification email to admin
    const notificationResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LDP Publisher <onboarding@resend.dev>",
        to: [targetEmail],
        subject: `[LDP Publisher] ${subject}`,
        text: notificationContent,
        reply_to: email,
      }),
    });

    if (!notificationResponse.ok) {
      const errorText = await notificationResponse.text();
      console.error("Failed to send notification email:", errorText);
      return new Response(
        JSON.stringify({ error: "Gagal mengirim email. Silakan coba lagi nanti." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Notification email sent successfully to admin");

    // Send confirmation email to sender
    const confirmationResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LDP Publisher <onboarding@resend.dev>",
        to: [email],
        subject: "Terima Kasih atas Pesan Anda - LDP Publisher",
        html: confirmationHtml,
      }),
    });

    if (!confirmationResponse.ok) {
      const errorText = await confirmationResponse.text();
      console.error("Failed to send confirmation email:", errorText);
      // Don't fail the request, just log the error since main notification was sent
    } else {
      console.log("Confirmation email sent successfully to sender");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Pesan berhasil dikirim! Kami akan segera menghubungi Anda." 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing contact form:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});