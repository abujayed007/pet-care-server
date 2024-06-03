require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())



const uri = process.env.APP_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const petsCollection = client.db('allPets').collection('pets')
        const usersCollection = client.db('allPets').collection('users')

        await client.connect();



        app.get('/pets', async (req, res) => {
            const pets = req.body
            const data = await petsCollection.find(pets)
            const allPets = await data.toArray()
            // console.log(allPets);
            res.send(allPets)
        })
        app.get('/pets/get/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await petsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/pets/type/:type', async (req, res) => {
            const type = req.params.type
            const query = { type: type }
            const result = await petsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/pets/:id', async (req, res) => {
            const id = req.params.id
            const result = await petsCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        app.patch('/pets/:id', async (req, res) => {
            const id = req.params.id
            const userData = req.body
            const query = { _id: new ObjectId(id) }
            const updateData = { $set: userData }
            const filter = { upsert: true }
            const result = await petsCollection.updateOne(query, updateData, filter)
            res.send(result)
        })
        app.post('/pets', async (req, res) => {
            const pets = req.body
            const result = await petsCollection.insertOne(pets)
            res.send(result)
        })
        app.delete('/pets/:id', async (req, res) => {
            const id = req.params.id
            const result = await petsCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        app.post('/user', async (req, res) => {
            const user = req.body
            const existUser = await usersCollection.findOne({ email: user?.email })
            if (existUser?.email) {
                return res.send(
                    {
                        status: "Success",
                        message: 'Login Success'
                    }
                )
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const result = await usersCollection.findOne({ email: email })
            res.send(result)
        })

        await client.db("admin").command({ ping: 1 });

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Api running')
})

app.listen(port, () => {
    console.log(`App running on port ${port}`);
})