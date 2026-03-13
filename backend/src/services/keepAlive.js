import axios from 'axios'
import cron from 'node-cron'

const DEFAULT_CRON = '*/14 * * * *'
const DEFAULT_TIMEOUT_MS = 10_000

function normalizeTargetUrl(value) {
    const raw = String(value ?? '').trim()
    if (!raw) return ''

    try {
        return new URL(raw).toString()
    } catch {
        return ''
    }
}

async function pingTarget(url) {
    const startedAt = Date.now()

    try {
        const response = await axios.get(url, {
            timeout: DEFAULT_TIMEOUT_MS,
            headers: {
                'User-Agent': 'g-mart-keep-alive',
            },
        })

        // eslint-disable-next-line no-console
        console.log(
            `[keep-alive] ping ok ${response.status} ${url} ${Date.now() - startedAt}ms`,
        )
    } catch (error) {
        const status = error?.response?.status
        const message = status ? `HTTP ${status}` : error?.message ?? 'Unknown error'

        // eslint-disable-next-line no-console
        console.error(`[keep-alive] ping failed ${url}: ${message}`)
    }
}

export function startKeepAliveJob() {
    const isEnabled = process.env.KEEP_ALIVE_ENABLED === 'true'
    const targetUrl = normalizeTargetUrl(process.env.KEEP_ALIVE_TARGET_URL)

    if (!isEnabled) {
        return null
    }

    if (!targetUrl) {
        // eslint-disable-next-line no-console
        console.warn('[keep-alive] skipped: KEEP_ALIVE_TARGET_URL is missing or invalid')
        return null
    }

    const schedule = String(process.env.KEEP_ALIVE_CRON ?? DEFAULT_CRON).trim() || DEFAULT_CRON

    if (!cron.validate(schedule)) {
        // eslint-disable-next-line no-console
        console.warn(`[keep-alive] skipped: invalid cron expression "${schedule}"`)
        return null
    }

    const task = cron.schedule(schedule, () => {
        void pingTarget(targetUrl)
    })

    // Warm the target shortly after boot instead of waiting for the first interval.
    setTimeout(() => {
        void pingTarget(targetUrl)
    }, 5_000)

    // eslint-disable-next-line no-console
    console.log(`[keep-alive] scheduled ${schedule} -> ${targetUrl}`)

    return task
}