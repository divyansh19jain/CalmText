import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


async def send_otp_email(to_email: str, otp: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "CalmText — Your Password Reset Code"
    msg["From"] = settings.gmail_user
    msg["To"] = to_email

    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f9f9;border-radius:16px;">
      <h2 style="color:#2563EB;margin-bottom:8px;">CalmText</h2>
      <p style="color:#555;font-size:15px;">Use the code below to reset your password. It expires in <b>10 minutes</b>.</p>
      <div style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#1e293b;text-align:center;padding:24px 0;">
        {otp}
      </div>
      <p style="color:#999;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.gmail_user,
        password=settings.gmail_app_password,
    )
