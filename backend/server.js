import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import supportRouter from './routes/supportRoute.js'

// App Config
const app = express()

// middlewares
app.use(express.json())
app.use(cors())

// Keep a lightweight endpoint available even when the database is down.
app.get('/', (req, res) => {
    res.send('API Working')
})
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Function is running' })
})

// Reuse a single database connection in warm serverless instances.
app.use(async (req, res, next) => {
    try {
        await connectDB()
        next()
    } catch (error) {
        console.error('Database connection failed:', error.message)
        res.status(503).json({ success: false, message: 'Database unavailable. Check the MONGODB_URI deployment setting.' })
    }
})
connectCloudinary()

// api endpoints
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)
app.use('/api/support',supportRouter)

if (!process.env.VERCEL) {
    const port = process.env.PORT || 4000
    app.listen(port, () => console.log('Server started on PORT : ' + port))
}

export default app
