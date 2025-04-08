import * as cron from 'node-cron'
import { sendEmail } from '~/lib/mail.server'
import { db } from '~/lib/prisma.server'

interface User {
  firstName: string
  lastName: string
  email: string
}

async function sendUpdateEmails() {
  try {
    const users = await db.user.findMany({
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
            text: generateEmailContent(user),
          }),
        ),
      )
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  } catch (error) {
    console.error('Failed to send update emails:', error)
  }
}

function generateEmailContent(user: User): string {
  return `
    Hello ${user.firstName} ${user.lastName},
    
    Here's your weekly update...
    
    Best regards,
    Your App Team
  `
}

// Schedule emails to send every Monday at 9 AM
export function scheduleEmails() {
  cron.schedule('0 9 * * 1', sendUpdateEmails)
}

// For manual triggers or testing
export async function sendImmediateUpdates() {
  await sendUpdateEmails()
}
