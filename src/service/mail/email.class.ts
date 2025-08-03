// utils/email.class.ts
import * as nodemailer from "nodemailer";

export class Email {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor(
    private service: string,
    private address: string,
    private password: string
  ) {
    this.from = this.address;
    this.transporter = nodemailer.createTransport({
      service: this.service,
      auth: {
        user: this.address,
        pass: this.password,
      },
    });
  }

  /**
   * Sends an email with Markdown content converted to HTML.
   *
   * @param to - Recipient email.
   * @param subject - Email subject.
   * @param markdown - Markdown string to send as HTML email.
   */
  async sendMarkdownEmail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<nodemailer.SentMessageInfo> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}: ${info?.messageId}`);
      return info;
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw error;
    }
  }
}
