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

interface SendEmailProps extends MailOptions {}

export const sendEmail = async ({ to, text, subject }: SendEmailProps) => {
  const response = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    text,
    subject,
  })

  console.log(response.response)

  return response.response
}
