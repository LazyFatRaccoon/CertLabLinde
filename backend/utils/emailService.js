const nodemailer = require("nodemailer");
const validator = require("validator");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Надіслати email.
 * @param {Object} opts
 * @param {string} opts.to      - Email отримувача
 * @param {string} opts.subject - Тема листа
 * @param {string} opts.text    - Текстова частина
 * @param {string} [opts.html]  - (опціонально) HTML-верія
 **/

const sendEmailObj = async ({ to, subject, text, html }) => {
  try {
    /* 1️⃣  базова валідація адреси */
    if (!validator.isEmail(to || "")) {
      throw new Error(`Invalid recipient email: '${to}'`);
    }

    /* 2️⃣  відправка */
    const info = await transporter.sendMail({
      from: `CertLab <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 Email '${subject}' sent to ${to} (${info.messageId})`);
    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw error; // прокидуємо далі, щоб роут повернув 500/400
  }
};

const sendEmail = (to, subject, text, html) =>
  sendEmailObj({ to, subject, text, html });

module.exports = { sendEmail };
