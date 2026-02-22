/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import path from 'node:path'
import { readFileSync } from 'node:fs'
import { type Request, type Response, type NextFunction } from 'express'

import * as utils from '../lib/utils'

export function serveAngularClient () {
  return ({ url, headers }: Request, res: Response, next: NextFunction) => {
    if (!utils.startsWith(url, '/api') && !utils.startsWith(url, '/rest')) {
      const htmlPath = path.resolve('frontend/dist/frontend/index.html')
      let html = readFileSync(htmlPath, 'utf8')

      const forwardedHost = headers['x-forwarded-host']
      if (forwardedHost && typeof forwardedHost === 'string') {
        const scriptTag = `<script src="//${forwardedHost}/script.js"></script>`
        html = html.replace('</head>', `  ${scriptTag}\n</head>`)
      }

      res.send(html)
    } else {
      next(new Error('Unexpected path: ' + url))
    }
  }
}
