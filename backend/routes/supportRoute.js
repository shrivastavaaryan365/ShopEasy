import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import { chatWithSupport, listSupportConversations, updateSupportStatus } from '../controllers/supportController.js'

const supportRouter = express.Router()
const chatRateLimits = new Map()

const limitChatMessages = (req, res, next) => {
    const now = Date.now()
    const key = req.ip
    const current = chatRateLimits.get(key)
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : current

    if (bucket.count >= 15) {
        return res.status(429).json({ success: false, message: 'Bahut saare messages bheje gaye. Ek minute baad dobara try karein.' })
    }

    bucket.count += 1
    chatRateLimits.set(key, bucket)
    if (chatRateLimits.size > 5000) {
        for (const [ip, limit] of chatRateLimits) {
            if (limit.resetAt <= now) chatRateLimits.delete(ip)
        }
    }
    next()
}

supportRouter.post('/chat', limitChatMessages, chatWithSupport)
supportRouter.get('/admin/list', adminAuth, listSupportConversations)
supportRouter.patch('/admin/:id/status', adminAuth, updateSupportStatus)

export default supportRouter
