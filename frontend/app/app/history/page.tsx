import { redirect } from 'next/navigation'

// Sends old history links to the single sessions list.
export default function HistoryPage() {
  redirect('/app/sessions')
}

