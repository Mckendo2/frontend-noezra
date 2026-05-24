import AppRouter from '@/router'
import { Toaster } from 'sonner'

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster richColors position="top-right" visibleToasts={1} duration={2500} closeButton />
    </>
  )
}
