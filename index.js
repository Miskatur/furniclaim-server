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
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader)
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const categoriesCollection = client.db('furniClaim').collection('categories');
        const productsCollection = client.db('furniClaim').collection('products');
        const usersCollection = client.db('furniClaim').collection('users');
        const OrdersCollectcion = client.db('furniClaim').collection('orders');

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN)
            res.send({ token })
        })

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

        app.get('/products', async (req, res) => {
            const query = {};
            const products = await productsCollection.find(query).sort({ "_id": -1 }).toArray();
            res.send(products)
        })
        app.get('/product', async (req, res) => {
            const query = {};
            const products = await productsCollection.find(query).sort({ "_id": -1 }).toArray();
            res.send(products)
        })

        app.get('/product/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const result = await productsCollection.find(filter).toArray()
            res.send(result)
        })

        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(filter)
            res.send(result)
        })

        app.get('/products/:name', async (req, res) => {
            const name = req.params.name;
            const filter = { category: name }
            const products = await productsCollection.find(filter).toArray()
            res.send(products)
        })

        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })

        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    advertise: true
                }
            }

            const result = await productsCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
        app.put(`/userverify/:id`, async (req, res) => {
            const id = req.params.id;
            const filter = { sellerId: id }
            const updatedDoc = {
                $set: {
                    verified: true
                }
            }

            const result = await productsCollection.updateMany(filter, updatedDoc)
            res.send(result)

        })

        app.get('/advproduct', async (req, res) => {
            const filter = { advertise: true }
            const result = await productsCollection.find(filter).sort({ "_id": -1 }).limit(3).toArray()
            res.send(result)
        })

        app.get('/users', async (req, res) => {
            const query = {}
            const result = await usersCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const result = await usersCollection.findOne(filter)
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.get('/users/admin/seller', async (req, res) => {
            const filter = { role: 'Seller' }
            const result = await usersCollection.find(filter).toArray()
            res.send(result)
        })


        app.put('/users/admin/seller/verify/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    verified: true
                }
            }

            // const result = await productsCollection.updateOne(filter, updatedDoc)
            const result = await usersCollection.updateOne(filter, updatedDoc, options)

            res.send(result)

        })

        app.get('/users/admin/buyer', async (req, res) => {
            const filter = { role: 'Buyer' }
            const result = await usersCollection.find(filter).toArray()
            res.send(result)
        })
        app.get('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.findOne(filter)
            res.send(result)
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result)
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await OrdersCollectcion.insertOne(order)
            res.send(result)
        })

        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const filter = { clientEmail: email }
            const result = await OrdersCollectcion.find(filter).toArray()
            res.send(result)
        })

        app.put('/reportproduct/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    report: true
                }
            }

            const result = await productsCollection.updateOne(filter, updatedDoc, options)
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