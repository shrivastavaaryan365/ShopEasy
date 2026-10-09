import validator from 'validator'
import supportConversationModel from '../models/supportConversationModel.js'

const supportInstructions = `You are ShopEasy's friendly customer assistant. Reply in the language the customer uses (Hindi/Hinglish or English). Answer general questions helpfully when you know the answer, and help with shopping, products, delivery, payments, returns, and order issues. Be concise and empathetic. For ShopEasy-specific facts that are not provided, say you do not know rather than inventing policies, prices, or delivery dates. Never claim to have checked an order, changed an order, issued a refund, or contacted a human. You cannot access private order data. For account-specific or unresolved problems, explain that the conversation has been shared with the ShopEasy support team and an admin will review it.`

const getFallbackReply = (message) => {
    const text = message.toLowerCase()
    if (/\b(hello|hi|hey|namaste|नमस्ते|हेलो)\b/.test(text)) return 'Namaste! Main ShopEasy assistant hoon. Products, sizing, payment, delivery, return ya order issue ke baare mein pooch sakte hain. Aapko kis cheez mein help chahiye?'
    if (/\b(order|ऑर्डर|delivery|deliver|shipping|tracking|track|डिलीवरी|पार्सल)\b/.test(text)) return 'Order ki exact status main yahan check nahi kar sakta. Apne account ke Orders section mein status dekhein; agar order late ya missing hai to order number ke saath yahin message bhejein, admin review karega.'
    if (/\b(refund|return|exchange|वापस|रिफंड|एक्सचेंज)\b/.test(text)) return 'Return ya refund ke liye order number aur issue ka short detail bhejein. Main policy ya refund status confirm nahi kar sakta, lekin aapka message admin inbox mein review ke liye save hoga.'
    if (/\b(payment|paid|charge|कार्ड|पेमेंट|भुगतान|पैसे कट)\b/.test(text)) return 'Payment issue ke liye batayein payment successful dikh raha hai ya amount debit hua par order nahi bana. Card/UPI number ya OTP share na karein. Account-specific issue admin inbox mein review ke liye save hota hai.'
    if (/\b(size|sizing|fit|साइज|आकार)\b/.test(text)) return 'Product page par available sizes check karein. Aap product ka naam aur apni usual size bata dein, main listing mein di gayi information ke hisaab se guide karne ki koshish karunga.'
    return 'Main ShopEasy shopping aur support mein help kar sakta hoon. Apna sawal thoda detail mein batayein—jaise product, size, payment, delivery, return, ya order issue. ShopEasy ki account-specific details admin verify karega.'
}

const isComplaintMessage = (message) => /\b(complaint|complain|issue|problem|damaged|broken|wrong item|not received|missing|late|refund|scam|fraud)\b|शिकायत|समस्या|खराब|टूटा|गलत सामान|नहीं मिला|देरी|रिफंड|पैसे कट|परेशानी/i.test(message)

const createAssistantReply = async (messages) => {
    if (!process.env.OPENAI_API_KEY) return getFallbackReply(messages[messages.length - 1]?.content || '')

    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
            instructions: supportInstructions,
            input: messages.slice(-12).map(({ role, content }) => ({ role, content }))
        }),
        signal: AbortSignal.timeout(20000)
    })

    const data = await response.json()
    if (!response.ok) {
        console.error('OpenAI support request failed:', data.error?.message || response.statusText)
        throw new Error('AI service request failed')
    }

    const answer = data.output
        ?.filter((item) => item.type === 'message')
        .flatMap((item) => item.content || [])
        .filter((item) => item.type === 'output_text')
        .map((item) => item.text)
        .join('\n')

    return answer?.trim() || 'Sorry, main abhi jawab nahi de pa raha. Aapka message support team ko mil gaya hai.'
}

const chatWithSupport = async (req, res) => {
    const { conversationId, message, customerName = '', customerEmail = '' } = req.body || {}

    if (!/^[0-9a-f-]{36}$/i.test(conversationId || '')) {
        return res.status(400).json({ success: false, message: 'Invalid conversation. Please start a new chat.' })
    }
    if (typeof message !== 'string' || !message.trim() || message.trim().length > 1000) {
        return res.status(400).json({ success: false, message: 'Message must be between 1 and 1000 characters.' })
    }
    if (typeof customerName !== 'string' || customerName.length > 100) {
        return res.status(400).json({ success: false, message: 'Name must be 100 characters or fewer.' })
    }
    if (customerEmail && (typeof customerEmail !== 'string' || !validator.isEmail(customerEmail) || customerEmail.length > 254)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' })
    }

    try {
        const isComplaint = isComplaintMessage(message)
        const conversation = await supportConversationModel.findOneAndUpdate(
            { conversationId },
            {
                $setOnInsert: { conversationId },
                $set: {
                    ...(customerName.trim() && { customerName: customerName.trim() }),
                    ...(customerEmail.trim() && { customerEmail: customerEmail.trim().toLowerCase() }),
                    ...(isComplaint && { isComplaint: true, status: 'Open' })
                },
                $push: { messages: { role: 'user', content: message.trim() } }
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        )

        let reply
        try {
            reply = await createAssistantReply(conversation.messages)
        } catch {
            reply = 'Sorry, AI assistant se abhi connection nahi ho pa raha. Aapka message support team ko mil gaya hai; admin aapse follow up karega.'
        }

        if (isComplaint && !/admin|support team/i.test(reply)) {
            reply += ' Aapki complaint admin support inbox mein bhej di gayi hai.'
        }

        conversation.messages.push({ role: 'assistant', content: reply })
        conversation.messages = conversation.messages.slice(-60)
        await conversation.save()
        return res.json({ success: true, reply })
    } catch (error) {
        console.error('Support chat error:', error)
        return res.status(500).json({ success: false, message: 'Message save nahi ho paya. Please try again.' })
    }
}

const listSupportConversations = async (req, res) => {
    try {
        const conversations = await supportConversationModel.find({})
            .sort({ updatedAt: -1 })
            .limit(200)
            .lean()
        res.json({ success: true, conversations })
    } catch (error) {
        console.error('Support inbox error:', error)
        res.status(500).json({ success: false, message: 'Could not load support inbox.' })
    }
}

const updateSupportStatus = async (req, res) => {
    const { status } = req.body || {}
    if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid support status.' })
    }

    try {
        const conversation = await supportConversationModel.findByIdAndUpdate(req.params.id, { status }, { new: true })
        if (!conversation) return res.status(404).json({ success: false, message: 'Support conversation not found.' })
        res.json({ success: true, conversation })
    } catch (error) {
        console.error('Support status update error:', error)
        res.status(500).json({ success: false, message: 'Could not update support status.' })
    }
}

export { chatWithSupport, listSupportConversations, updateSupportStatus }
