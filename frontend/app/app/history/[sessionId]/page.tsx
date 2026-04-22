import { redirect } from 'next/navigation'

// Sends old history detail links to the sessions detail page.
export default function SessionHistoryPage({ params }: { params: { sessionId: string } }) {
  redirect(`/app/sessions/${params.sessionId}`)
}
