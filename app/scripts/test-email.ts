import { sendImmediateUpdates } from '../lib/email-service'
import { config } from 'dotenv'

// Load environment variables
config()

async function main() {
  console.log('🚀 Starting email test...')
  console.log('📝 Checking environment variables...')

  // Check if required environment variables are set
  const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASS']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    console.error(
      '❌ Missing required environment variables:',
      missingVars.join(', '),
    )
    console.error('Please check your .env file')
    process.exit(1)
  }

  console.log('✅ Environment variables check passed')
  console.log('📧 Email will be sent from:', process.env.EMAIL_USER)

  try {
    console.log('📤 Attempting to send emails...')
    await sendImmediateUpdates()
    console.log('✅ Email test completed successfully!')
  } catch (error) {
    console.error('❌ Email test failed:', error)
    process.exit(1)
  }
}

main()
