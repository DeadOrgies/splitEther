//frontend utils
const express = require('express');
const app = express();
const port = 3000;

//mongoose init
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/splitEthTx', {useNewUrlParser: true, useUnifiedTopology: true})
.then(()=> {console.log('DB connected!')})
.catch((err)=> console.log(err));

const Schema = new mongoose.Schema({

    Txhash: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const transactions = mongoose.model('transactions', Schema);

//redis init
const Redis = require('redis');
const bluebird = require('bluebird');
bluebird.promisifyAll(Redis);
const client = Redis.createClient();


//web3 + contract init
const Web3 = require('web3');
const splitEth = require('./build/contracts/splitEth.json');


//smart contract instance
const init = async (res) => {

    const web3 = new Web3('http://localhost:9545');
    const id = await web3.eth.net.getId();
    const deployedNetwork = splitEth.networks[id];



    const contract = new web3.eth.Contract(
        splitEth.abi,
        deployedNetwork.address
    );

    accounts = await web3.eth.getAccounts()

    const address1 = await client.getAsync('address1')
    const address2 = await client.getAsync('address2')
    const saddress = await client.getAsync('saddress')
    const amt = await client.getAsync('amount');
    const _pkey = await client.getAsync('pkey');
    var txhash, gas_used;


    const deposit = async () => {

        await contract.methods.deposit().send({

            from: await address1,
            value: web3.utils.toWei(amt, "ether")
            
        });
    }
    
    const withdraw = async () => {
        await contract.methods.withdraw().send(
            {
                from: accounts[0]
            }
        )
    }

    const transferEth = async () => {


        await contract.methods.transferEth(address1, address2).send(
            {
                from: saddress,
                value: web3.utils.toWei(amt, "ether")
            }).on('transactionHash', async(hash) => {

                
                console.log(hash)
                receipt = await web3.eth.getTransactionReceipt(hash)
                console.log(receipt.gasUsed)
                await client.setAsync('txhash', hash)
                await client.setAsync('gas_used', receipt.gasUsed);
                txhash =  await hash;
                gas_used = await receipt.gasUsed;
                
  

            });


    }


    await transferEth();
    new transactions({Txhash: txhash}).save();
    res.render('txn', { address1: address1, address2: address2, saddress: saddress, amt: amt, txhash: txhash, gasUsed: gas_used });

  
}

const setCurrentData = (req) => {


    client.setex('address1', 3600, req.body.addr1);
    client.setex('address2', 3600, req.body.addr2);
    client.setex('amount', 3600, req.body.amount);
    client.setex('saddress', 3600, req.body.saddress);
    client.setex('pkey', 3600, req.body.pkey);

    client.on("error", function (err) {
        console.log("Error " + err);
    });
}




app.use(express.static('./'))
app.use('scripts', express(__dirname + './scripts'));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }))

app.get('/', (req, res) => {


    res.render('index');

})

app.post('/', async (req, res) => {

    setCurrentData(req);        
    console.log('inserted');
    await init(res)
    

})




app.listen(port, () => console.info('Listening on port ' + port));




