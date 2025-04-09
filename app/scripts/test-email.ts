import { sendImmediateUpdates } from '../lib/email-service'

async function main() {
  try {
    console.log('Starting email test...')
    await sendImmediateUpdates()
    console.log('✅ Emails sent successfully!')
  } catch (error) {
    console.error('❌ Failed to send emails:', error)
  } finally {
    process.exit(0)
  }
}

main()
