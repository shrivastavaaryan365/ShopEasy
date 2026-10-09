import mongoose from "mongoose";

const connectDB = async () => {

    mongoose.connection.on('connected',() => {
        console.log("DB Connected");
    })

    // Keep the database name separate from the URI path. Appending it to a URI
    // that already contains a database path can create an invalid namespace.
    await mongoose.connect(process.env.MONGODB_URI.trim(), { dbName: 'e-commerce' })

}

export default connectDB;
