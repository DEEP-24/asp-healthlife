import * as nodemailer from 'nodemailer'
import type { MailOptions } from 'nodemailer/lib/sendmail-transport'

const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use your email service
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your password
  },
})

interface SendEmailProps extends Omit<MailOptions, 'html' | 'text'> {
  text?: string
  html?: string
}

export const sendEmail = async ({
  to,
  text,
  subject,
  html,
}: SendEmailProps) => {
  const response = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    text,
    subject,
    html,
  })

  console.log(response.response)

  return response.response
}
