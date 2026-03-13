"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

interface TypingAnimationProps {
  text: string
  className?: string
  cursorClassName?: string
  speed?: number
  delay?: number
  as?: "h1" | "h2" | "h3" | "p" | "span"
  showCursor?: boolean
  onComplete?: () => void
}

export function TypingAnimation({
  text,
  className,
  cursorClassName,
  speed = 40,
  delay = 0,
  as: Tag = "h1",
  showCursor = true,
  onComplete,
}: TypingAnimationProps) {
  const shouldReduceMotion = useReducedMotion()
  const [displayedCount, setDisplayedCount] = useState(
    shouldReduceMotion ? text.length : 0
  )
  const [started, setStarted] = useState(shouldReduceMotion)

  useEffect(() => {
    if (shouldReduceMotion) return
    const delayTimer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(delayTimer)
  }, [delay, shouldReduceMotion])

  useEffect(() => {
    if (!started || shouldReduceMotion) return
    if (displayedCount >= text.length) {
      onComplete?.()
      return
    }
    const timer = setTimeout(
      () => setDisplayedCount((c) => c + 1),
      speed
    )
    return () => clearTimeout(timer)
  }, [started, displayedCount, text.length, speed, shouldReduceMotion, onComplete])

  return (
    <Tag className={cn("font-mono", className)}>
      {text.slice(0, displayedCount)}
      {showCursor && (
        <motion.span
          className={cn("inline-block animate-blink", cursorClassName)}
          aria-hidden
        >
          _
        </motion.span>
      )}
    </Tag>
  )
}
