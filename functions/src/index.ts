import * as functions from "firebase-functions";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// HTTPS callable: send OTP to email
export const sendOtpEmail = functions.https.onCall(
  async (
    request: functions.https.CallableRequest<{ email: string; otp: string }>
  ) => {
    const email = request.data.email?.trim().toLowerCase();
    const otp = request.data.otp?.trim();

    if (!email || !otp) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email and otp are required."
      );
    }

    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || "HostelX <onboarding@resend.dev>",
        to: email,
        subject: "Your HostelX verification code",
        text: `Your HostelX verification code is ${otp}. It will expire soon.`,
      });

      return { success: true };
    } catch (err: any) {
      console.error("sendOtpEmail error", err);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send OTP email."
      );
    }
  }
);

