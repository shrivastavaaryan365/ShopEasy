import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 3000 },
    createdAt: { type: Date, default: Date.now }
}, { _id: false })

const supportConversationSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, trim: true, maxlength: 100, default: '' },
    customerEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    isComplaint: { type: Boolean, default: false },
    messages: { type: [messageSchema], default: [] },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' }
}, { timestamps: true })

const supportConversationModel = mongoose.models.supportConversation || mongoose.model('supportConversation', supportConversationSchema)
export default supportConversationModel
