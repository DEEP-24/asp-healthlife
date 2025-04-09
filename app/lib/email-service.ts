import * as cron from 'node-cron'
import { P } from 'ts-pattern'
import { sendEmail } from '~/lib/mail.server'
import { db } from '~/lib/prisma.server'
import { UserRole } from '~/utils/enums'

interface User {
  firstName: string
  lastName: string
  email: string
}

async function sendUpdateEmails() {
  try {
    const users = await db.user.findMany({
      where: {
        role: UserRole.USER,
      },
      select: { email: true, firstName: true, lastName: true },
    })

    const batchSize = 10
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      await Promise.allSettled(
        batch.map(user =>
          sendEmail({
            to: user.email,
            subject: 'Weekly Reminder',
            text: generateTextEmailContent(user),
            html: generateHtmlEmailContent(user),
          }),
        ),
      )
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  } catch (error) {
    console.error('Failed to send update emails:', error)
  }
}

function generateTextEmailContent(user: User): string {
  return `
    Hello ${user.firstName} ${user.lastName},
    
    Here's your weekly update.
    Receive reminders for water, meal, workouts, and goal milestones.
    
    Best regards,
    Your App Team
  `
}

function generateHtmlEmailContent(user: User): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          padding: 20px;
          border: 1px solid #eee;
          border-radius: 5px;
          max-width: 600px;
          margin: 20px auto;
          background-color: #f9f9f9;
        }
        .header {
          font-size: 1.2em;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .footer {
          margin-top: 20px;
          font-size: 0.9em;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Hello ${user.firstName} ${user.lastName},</div>
        
        <p>Here's your bi-weekly update and friendly reminders!</p>

        <p>Remember to stay hydrated, stick to your meal plan, keep up with your workouts, and track your progress towards your goals.</p>

        <ul>
          <li>💧 Drink Water</li>
          <li>🍎 Log Meals</li>
          <li>🏋️ Complete Workouts</li>
          <li>🎯 Check Goal Milestones</li>
        </ul>
        
        <div class="footer">
          Best regards,<br>
          Your App Team
        </div>
      </div>
    </body>
    </html>
  `
}

// Schedule emails to send every Monday and Thursday at 9 AM
export function scheduleEmails() {
  cron.schedule('0 9 * * 1,4', sendUpdateEmails)
}

// For manual triggers or testing
export async function sendImmediateUpdates() {
  await sendUpdateEmails()
}
