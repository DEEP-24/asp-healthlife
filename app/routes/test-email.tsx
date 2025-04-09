import { json } from '@remix-run/node'
import { sendImmediateUpdates } from '~/lib/email-service'

export async function action() {
  try {
    await sendImmediateUpdates()
    return json({ success: true, message: 'Emails sent successfully' })
  } catch (error) {
    console.error('Failed to send test emails:', error)
    return json(
      { success: false, message: 'Failed to send emails' },
      { status: 500 },
    )
  }
}

export default function TestEmail() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test Email Service</h1>
      <form method="post">
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Send Test Emails
        </button>
      </form>
    </div>
  )
}
