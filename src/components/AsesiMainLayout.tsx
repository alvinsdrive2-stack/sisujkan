import { ReactNode, useState, useEffect } from "react"
import DashboardNavbar from "./DashboardNavbar"
import { useAuth } from "@/contexts/auth-context"
import { subscribeNavbarTimer } from "@/lib/navbar-timer"
import { FullPageLoader } from "@/components/ui/loading-spinner"

export default function AsesiMainLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const [timerNode, setTimerNode] = useState<ReactNode>(null)

  useEffect(() => subscribeNavbarTimer(setTimerNode), [])

  if (isLoading) {
    return <FullPageLoader text="Memuat..." />
  }

  return (
    <>
      <DashboardNavbar userName={user?.name} timerNode={timerNode} />
      {children}
    </>
  )
}
