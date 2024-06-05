var jwt = require('jsonwebtoken');
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = 5000

app.use(cors())
app.use(express.json())


function createToken(user) {
    const token = jwt.sign({
        email: user?.email},
        'secret',
        { expiresIn: '10d' }
    )
    return token;
}
 
function verifyToken ( req, res, next){
    const token = req.headers.authorization.split(" ")[1]
    const verify = jwt.verify(token, 'secret')
    // console.log(verify);
    if(!verify?.email){
        return res.send('You Are Not Authorized')
    }
    req.user = verify.email
    next()
}
const user = process.env.APP_USER
const pass= process.env.APP_PASS
// const uri = `mongodb+srv://${user}:${pass}@cluster0.yyytqsz.mongodb.net/?retryWrites=true&w=majority& appName=Cluster0`;

const uri = `mongodb+srv://${user}:${pass}@cluster0.yyytqsz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri,
    {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const petsCollection = client.db('allPets').collection('pets')    
        const categoryCollection = client.db('allPets').collection('categories')    
        const usersCollection = client.db('allPets').collection('users')

        await client.connect();


        app.get('/category',async (req, res)=>{
            const query = req.body
            const filter =  categoryCollection.find(query)
            const result = await filter.toArray()
            res.send(result)
        })


        app.get('/pets', async (req, res) => {
            const filter = req.query
            // const query= {
            //     name:{$regex:filter.search}
            // }
            const data = await petsCollection.find(filter)
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

        app.patch('/pets/:id',verifyToken, async (req, res) => {
            const id = req.params.id
            const userData = req.body
            const query = { _id: new ObjectId(id) }
            const updateData = { $set: userData }
            const filter = { upsert: true }
            const result = await petsCollection.updateOne(query, updateData, filter)
            res.send(result)
        })
        app.post('/pets', verifyToken, async (req, res) => {
            const pets = req.body
            const result = await petsCollection.insertOne(pets)
            res.send(result)
        })
        app.delete('/pets/:id',verifyToken, async (req, res) => {
            const id = req.params.id
            const result = await petsCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        app.post('/user', async (req, res) => {
            const user = req.body
            const token = createToken(user)
            // console.log(token);
            const existUser = await usersCollection.findOne({ email: user?.email })
            if (existUser?.email) {
                return res.send(
                    {
                        status: "Success",
                        message: 'Login Success',
                        token
                    }
                )
            }
            await usersCollection.insertOne(user)
            res.send({ token })
        })

        app.get('/user',async (req, res)=>{
            const data = req.body
            const users =  usersCollection.find(data)
            const result =await users.toArray()
            res.send(result)
        })

        app.get("/user/get/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const result = await usersCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
          });

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const result = await usersCollection.findOne({ email})
            res.send(result)
        })

        

        app.patch('/user/:email',verifyToken, async (req, res) => {
            const email = req.params.email;
            const userData = req.body;
            const result = await usersCollection.updateOne(
              { email },
              { $set: userData },
              { upsert: true }
            );
            res.send(result);
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