import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    console.log("Processing contact form submission:", { name, email, subject });

    // Send email to the company
    const companyEmailResponse = await resend.emails.send({
      from: "Talk Contact Form <onboarding@resend.dev>",
      to: ["talkco@outlook.com"],
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div>
          <strong>Message:</strong>
          <p style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
            ${message.replace(/\n/g, '<br>')}
          </p>
        </div>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Sent from Talk contact form at ${new Date().toLocaleString()}
        </p>
      `,
    });

    // Send confirmation email to the user
    const userEmailResponse = await resend.emails.send({
      from: "Talk Support <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message - Talk Support",
      html: `
        <h2>Thank you for contacting Talk</h2>
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you as soon as possible, typically within 24 hours.</p>
        
        <h3>Your Message Summary:</h3>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        
        <p>If you need immediate support, remember:</p>
        <ul>
          <li><strong>Samaritans:</strong> Call 116 123 (free, 24/7)</li>
          <li><strong>Crisis Text Line UK:</strong> Text SHOUT to 85258</li>
          <li><strong>Emergency:</strong> Call 999</li>
        </ul>
        
        <p>Best regards,<br>The Talk Team</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated confirmation. Please do not reply to this email.
        </p>
      `,
    });

    console.log("Emails sent successfully:", { 
      company: companyEmailResponse.data?.id, 
      user: userEmailResponse.data?.id 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Emails sent successfully",
        companyEmailId: companyEmailResponse.data?.id,
        userEmailId: userEmailResponse.data?.id
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send email", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);