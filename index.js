const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000;

//middlewear
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster1.lgwxtbx.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoriesCollection = client.db('furniClaim').collection('categories');



        app.get('/categories', async (req, res) => {
            const query = {};
            const result = await categoriesCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await categoriesCollection.findOne(filter)
            res.send(result)
        })
    }
    finally {

    }
}
run().catch(error => console.error(error))




app.get('/', (req, res) => {
    res.send('Furniclaim is running on Server')
})

app.listen(port, () => {
    console.log(`Furniclaim is running on port: ${port}`);
})