/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import * as challengeUtils from './challengeUtils'
import { challenges } from '../data/datacache'

interface CacheEntry {
  content: string
  timestamp: number
}

const cache: Record<string, CacheEntry> = {}
const CACHE_TTL = 5 * 60 * 1000

function hasPoisonedBaseHref (body: string): boolean {
  
  const match = body.match(/<base[^>]*\shref="([^"]*)"[^>]*>/i)
  if (!match) {
    return false
  }

  const href = match[1]
  
  return href !== '/'
}

export function cacheMiddleware () {
  return (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = req.originalUrl

    if (cache[cacheKey]) {
      const entry = cache[cacheKey]
      const now = Date.now()

      if (now - entry.timestamp < CACHE_TTL) {
        if (hasPoisonedBaseHref(entry.content) && challenges.cachePoisoningChallenge) {
         
          challengeUtils.solve(challenges.cachePoisoningChallenge)
        }
        return res.send(entry.content)
      } else {
        delete cache[cacheKey]
      }
    }

    const originalSend = res.send.bind(res)
    res.send = function (body?: any) {
      if (typeof body === 'string') {
        cache[cacheKey] = {
          content: body,
          timestamp: Date.now()
        }
      }
      return originalSend(body)
    }

    next()
  }
}
