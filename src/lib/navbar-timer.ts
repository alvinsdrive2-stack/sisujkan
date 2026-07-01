import { ReactNode } from 'react'

let _timerNode: ReactNode = null
let _listener: ((node: ReactNode) => void) | null = null

export function setNavbarTimer(node: ReactNode) {
  _timerNode = node
  _listener?.(node)
}

export function subscribeNavbarTimer(cb: (node: ReactNode) => void) {
  _listener = cb
  cb(_timerNode)
  return () => { _listener = null }
}