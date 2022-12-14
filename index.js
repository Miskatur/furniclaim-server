const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET_KEY}`);

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
        const OrdersCollection = client.db('furniClaim').collection('orders');
        const paymentsCollection = client.db('furniClaim').collection('payments');


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
            const query = {
                availabilty: true
            };
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
            const filter = {
                email: email,
                availabilty: true
            }
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

        app.get('/products/client/:email', async (req, res) => {
            const email = req.params.email;
            const filter = {
                sellerEmail: email,
                availabilty: false
            }
            const result = await OrdersCollection.find(filter).toArray()
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
            const email = user.email
            const query = {
                email: email
            }
            const userExist = await usersCollection.find(query).toArray()
            if (userExist.length) {
                return
            }
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
            const query = {
                clientEmail: order.clientEmail,
                productName: order.productName
            }
            const bookOrder = await OrdersCollection.find(query).toArray()
            if (bookOrder.length) {
                const message = `You already have added ${order.productName} on your cart.`
                return res.send({ acknowledged: false, message })
            }
            const result = await OrdersCollection.insertOne(order)
            res.send(result)
        })

        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment)
            const id = payment.bookingId;
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: {
                    availabilty: false,
                    transactionId: payment.transactionId
                }
            }
            const updateResult = await OrdersCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.put(`/product/update/:id`, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    availabilty: false
                }
            }
            const updateProduct = await productsCollection.updateOne(filter, updatedDoc, options)
            res.send(updateProduct)
        })

        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const filter = { clientEmail: email }
            const result = await OrdersCollection.find(filter).toArray()
            res.send(result)
        })

        app.get('/allorders', async (req, res) => {
            const query = {}
            const result = await OrdersCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await OrdersCollection.findOne(query)
            res.send(result)
        })

        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await OrdersCollection.deleteOne(filter)
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

        app.get('/reporteditems', async (req, res) => {
            const query = { report: true }
            const result = await productsCollection.find(query).toArray()
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