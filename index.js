const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const app = express()
dotenv.config()
const port = process.env.PORT;
const uri = process.env.MONGODB_URI;
app.use(cors())
app.use(express.json())


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)
const verifyToken = async (req, res, next) => {
    const header = req.headers.authorization
    if (!header) {
        res.status(401).json({ massage: 'Unauthorized' })
    }
    const token = header.split(" ")[1]
    if (!token) {
        res.status(401).json({ massage: 'Unauthorized' })
    }
    try {
        const { payload } = await jwtVerify(token, JWKS)
        // console.log(payload);
        next()
    } catch (error) {
        return res.status(403).json({ massage: "Forbidden" })
    }
}
async function run() {
    try {
        const db = client.db('sportnest')
        const facilitiesCollection = db.collection('facilities')
        const bookingsCollection = db.collection('bookings')
        // facilities
        app.post('/facilities', async (req, res) => {
            const facility = req.body
            const result = await facilitiesCollection.insertOne(facility)
            res.json(result)
        })
        app.get('/featured', async (req, res) => {
            const featuredData = await facilitiesCollection.find().limit(6).toArray()
            res.send(featuredData)
        })
        app.get('/facilities', async (req, res) => {
            const allFacilities = await facilitiesCollection.find().toArray()
            // console.log(allFacilities);
            res.send(allFacilities)
        })
        app.get('/facilities/:id', verifyToken, async (req, res, next) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await facilitiesCollection.findOne(query)
            // console.log(result);
            res.send(result)

        })
        app.patch('/facilities/:id', async (req, res) => {
            const id = req.params.id;
            const updatedFacilities = req.body;
            const result = await facilitiesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedFacilities }
            )
            // console.log(result);
            res.send(result)

        })
        app.get('/facilities/user/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { owner_email: email }
            const result = await facilitiesCollection.find(query).toArray()
            // console.log(result);
            res.send(result)

        })
        app.delete('/facilities/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await facilitiesCollection.deleteOne(query)
            res.send(result)
        })
        // Booking
        app.post('/bookings', async (req, res) => {
            const bookingData = req.body
            const result = await bookingsCollection.insertOne(bookingData)
            res.send(result)
        })
        // app.get('/bookings' ,async(req ,res) => {
        //     const userId = req.params.userId;

        //     const allBookings = await bookingsCollection.find().toArray();
        //     res.send(allBookings)
        // })
        app.get('/bookings/:userId',verifyToken, async (req, res) => {
            const userId = req.params.userId;
            const query = { userId: { $eq: userId } }
            const allBookings = await bookingsCollection.find(query).toArray();
            res.send(allBookings)
        })
        app.delete('/bookings/:bookingId', async (req, res) => {
            const bookingId = req.params.bookingId;
            const result = await bookingsCollection.deleteOne({ _id: new ObjectId(bookingId) })
            res.send(result)
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
