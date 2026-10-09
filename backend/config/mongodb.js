import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (connectionPromise) return connectionPromise;

    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) throw new Error('MONGODB_URI is not configured');

    // Keep the database name separate from the URI path.
    connectionPromise = mongoose.connect(uri, {
        dbName: 'e-commerce',
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
    })
        .then(({ connection }) => {
            console.log('DB Connected');
            return connection;
        })
        .catch((error) => {
            connectionPromise = undefined;
            throw error;
        });
    return connectionPromise;
}

export default connectDB;
