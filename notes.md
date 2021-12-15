## Hardhat

Hardhat lets you easily spin up a local Ethereum network and give you fake test ETH and fake test accounts to work with.

```bash
mkdir my-project
cd my-project
npm init -y
npm install --save-dev hardhat
```

```bash
npx hardhat
```

Choose create a sample project, this already adds the necessary dependencies for you but in case it doesn't:

```bash
npm install --save-dev @nomiclabs/hardhat-waffle ethereum-waffle chai @nomiclabs/hardhat-ethers ethers
```

```bash
npx hardhat accounts # this should print out a bunch of strings (the accounts).
```

## Run the project

```bash
npx hardhat compile
npx hardhat test
```

## Imitating the blockchain environment to test

We have our smart contract now we need to:

1. Compile it
2. Deploy it to our local blockchain
3. Once it's there, the constructor will run

In the real world, smart contracts live on the blockchain. And we want our website and smart contract to be used by real people so they can interact with us or do whatever we want them to do.

Even when we're working locally we want to imitate that environment.

### Create a scripts/run.js to test the smart contract:

```js
const main = async () => {
    const myContractFactory = await hre.ethers.getContractFactory("MyContract");
    const myContract = await myContractFactory.deploy();
    await myContract.deployed();
    console.log("Contract deployed to:", myContract.address);
}

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

runMain();
```

```bash
npx hardhat run scripts/run.js
```

When we run the previous script, hardhat is doing three things:

1. Creating a new local Ethereum network.
2. Deploying our contract.
3. Then, when the script ends Hardhat will automatically destroy that local network.

We need a way to keep the local network alive. Why? Well, think about a local server. You want to keep it alive so you can keep talking to it! For example, if you have a local server with an API you made, you want to keep that local server alive so you can work on your website and test it out.

Head to your terminal and create a new window. In this window, cd back to your my-project project. Then, in here go ahead and run

```bash
npx hardhat node
```

Let's create a file `deploy.js`:

```js
const main = async () => {
  const [deployer] = await hre.ethers.getSigners();
  const accountBalance = await deployer.getBalance();

  console.log('Deploying contracts with account: ', deployer.address);
  console.log('Account balance: ', accountBalance.toString());

  const Token = await hre.ethers.getContractFactory('MyContract');
  const portal = await Token.deploy();
  await portal.deployed();

  console.log('MyContract address: ', portal.address);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();
```

To run the file:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

The output will be something like:

> Deploying contracts with the account: 0xf31...
> Account balance: 1000..
> MyContract address: 0x4fb...

We deployed the contract, and we also have its address on the blockchain! Our website is going to need this so it knows where to look on the blockchain for your contract. 

## 📤 Setting up to deploy to the blockchain

Go ahead and make an account with Alchemy [here](https://alchemy.com/?r=b93d1f12b8828a57).

What Alchemy does is it gives us a simple way to deploy to the real Ethereum blockchain.

So, the blockchain has no owner. It's just a bunch of computers around the world run by miners that have a copy of the blockchain.
When we deploy our contract, we need to tell all those miners, "hey, this is a new smart contract, please add my smart contract to the blockchain and then tell everyone else about it as well".

This is where Alchemy comes in.

Alchemy essentially helps us broadcast our contract creation transaction so that it can be picked up by miners as quickly as possible.

- Create App
- Select Network: Rinkeby
- Selec t Chain: Ethereum
- Go to View Key: http

That url you will put in your hardhat.config

## Deploy to Rinkeby testnet.

We'll need to change our hardhat.config.js file. You can find this in the root directory of your smart contract project.

```js
require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    rinkeby: {
      url: 'YOUR_ALCHEMY_API_URL',
      accounts: ['YOUR_PRIVATE_RINKEBY_ACCOUNT_KEY'],
    },
  },
};
```

> Note: DON'T COMMIT THIS FILE TO GITHUB. IT HAS YOUR PRIVATE KEY. YOU WILL GET HACKED + ROBBED. THIS PRIVATE KEY IS THE SAME AS YOUR MAINNET PRIVATE KEY.

You can grab your API URL from the Alchemy dashboard and paste that in. Then, you'll need your private rinkeby key (not your public address!) which you can grab from metamask and paste that in there as well.

Once you've got your config setup we're set to deploy with the deploy script we wrote earlier.

Run this command from the root directory of my-wave-portal. Notice all we do is change it from localhost to rinkeby.

```bash
npx hardhat run scripts/deploy.js --network rinkeby
```

## 🌅 Using window.ethereum()

So, in order for our website to talk to the blockchain, we need to somehow connect our wallet to it. Once we connect our wallet to our website, our website will have permissions to call smart contracts on our behalf. Remember, it's just like authenticating in to a website.

```jsx
import React, { useEffect } from "react";
import './App.css';

const App = () => {
  const checkIfWalletIsConnected = () => {
    /*
    * First make sure we have access to window.ethereum
    */
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
  }

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])
  
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
          I am farza and I worked on self-driving cars so that's pretty cool right? Connect your Ethereum wallet and wave at me!
        </div>

        <button className="waveButton" onClick={null}>
          Wave at Me
        </button>
      </div>
    </div>
  );
}

export default App;
```

## 🔒 See if we can access the users account

Basically, Metamask doesn't just give our wallet credentials to every website we go to. It only gives it to websites we authorize. Again, it's just like logging in! But, what we're doing here is checking if we're "logged in".

Let's update `checkifWalletIsConnected` 

```jsx
const checkIfWalletIsConnected = async () => {
  try {
    const { ethereum } = window;
    
    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
    
    /*
    * Check if we're authorized to access the user's wallet
    */
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account)
    } else {
      console.log("No authorized account found")
    }
  } catch (error) {
    console.log(error);
  }
}
```

## 💰 Build a connect wallet button

```jsx
const connectWallet = async () => {
  try {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Get MetaMask!");
      return;
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });

    console.log("Connected", accounts[0]);
    setCurrentAccount(accounts[0]); 
  } catch (error) {
    console.log(error)
  }
}

return (
  {/* ... */}
  {!currentAccount && (
    <button className="waveButton" onClick={connectWallet}>
      Connect Wallet
    </button>
  )}
  {/* ... */}
)
```

## 📒 Read from the blockchain through our website

So, our smart contract has this function that retrieves the total number of waves.

```js
function getTotalWaves() public view returns (uint256) {
    console.log("We have %d total waves!", totalWaves);
    return totalWaves;
}
```

Let's call this function from our website. Add this to App.jsx:

```jsx
const wave = async () => {
  try {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      let count = await wavePortalContract.getTotalWaves();
      console.log("Retrieved total wave count...", count.toNumber());
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error)
  }
}
```

```js
const provider = new ethers.providers.Web3Provider(ethereum);
const signer = provider.getSigner();
```

ethers is a library that helps our frontend talk to our contract. Be sure to import it at the top using import { ethers } from "ethers";.

## 🏠 Setting Your Contract Address

Remember when you deployed your contract to the Rinkeby Testnet (epic btw)? The output from that deployment included your smart contract address which should look something like this:

```
Deploying contracts with the account: 0xF79A3bb8d5b93686c4068E2A97eAeC5fE4843E7D
Account balance: 3198297774605223721
WavePortal address: 0xd5f08a0ae197482FA808cE84E00E97d940dBD26E
```

You need to get access to this in your React app. It's as easy as creating a new property in your App.js file called contractAddress and setting it's value to the WavePortal address thats printed out in your console:

```jsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';

const App = () => {
const [currentAccount, setCurrentAccount] = useState("");
/**
* Create a variable here that holds the contract address after you deploy!
*/
const contractAddress = "0xd5f08a0ae197482FA808cE84E00E97d940dBD26E";
```

## 🛠 Getting ABI File Content

When you compile your smart contract, the compiler spits out a bunch of files needed that lets you interact with the contract. You can find these files in the artifacts folder located in the root of your Solidity project.

The ABI file is something our web app needs to know how to communicate with our contract. Read about it here.

The contents of the ABI file can be found in a fancy JSON file in your hardhat project:
artifacts/contracts/WavePortal.sol/WavePortal.json

So, the question becomes how do we get this JSON file into our frontend? For this project we are going to do some good old "copy pasta"!
Copy the contents from your WavePortal.json and then head to your web app. You are going to make a new folder called utils under src. Under utils create a file named WavePortal.json. So the full path will look like:
src/utils/WavePortal.json

Paste the whole JSON file right there!

Now that you have your file with all your ABI content ready to go, it's time to import it into your App.js file and create a reference to it. Right under where you imported App.css go ahead and import your JSON file and create your reference to the abi content:

```jsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");

  const contractAddress = "0xd5f08a0ae197482FA808cE84E00E97d940dBD26E";
  /**
    * Create a variable here that references the abi content!
    */
  const contractABI = abi.abi;
```

Let's take a look at where you are actually using this ABI content:

```jsx
const wave = async () => {
  try {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      /*
      * You're using contractABI here
      */
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      let count = await wavePortalContract.getTotalWaves();
      console.log("Retrieved total wave count...", count.toNumber());
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error)
  }
}
```

📝 Writing data

The code for writing data to our contract isn't super different from reading data. The main difference is that when we want to write new data to our contract, we need to notify the miners so that the transaction can be mined. When we read data, we don't need to do this. Reads are "free" because all we're doing is reading from the blockchain, *we're not changing it.*

```jsx
const wave = async () => {
  try {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      let count = await wavePortalContract.getTotalWaves();
      console.log("Retrieved total wave count...", count.toNumber());

      /*
      * Execute the actual wave from your smart contract
      */
      const waveTxn = await wavePortalContract.wave();
      console.log("Mining...", waveTxn.hash);

      await waveTxn.wait();
      console.log("Mined -- ", waveTxn.hash);

      count = await wavePortalContract.getTotalWaves();
      console.log("Retrieved total wave count...", count.toNumber());
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error)
  }
}
```

We can change our smart contract to look like this:

```c#
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract WavePortal {
    uint256 totalWaves;

    /*
     * A little magic, Google what events are in Solidity!
     */
    event NewWave(address indexed from, uint256 timestamp, string message);

    /*
     * I created a struct here named Wave.
     * A struct is basically a custom datatype where we can customize what we want to hold inside it.
     */
    struct Wave {
        address waver; // The address of the user who waved.
        string message; // The message the user sent.
        uint256 timestamp; // The timestamp when the user waved.
    }

    /*
     * I declare a variable waves that lets me store an array of structs.
     * This is what lets me hold all the waves anyone ever sends to me!
     */
    Wave[] waves;

    constructor() {
        console.log("I AM SMART CONTRACT. POG.");
    }

    /*
     * You'll notice I changed the wave function a little here as well and
     * now it requires a string called _message. This is the message our user
     * sends us from the frontend!
     */
    function wave(string memory _message) public {
        totalWaves += 1;
        console.log("%s has waved!", msg.sender);

        /*
         * This is where I actually store the wave data in the array.
         */
        waves.push(Wave(msg.sender, _message, block.timestamp));

        /*
         * I added some fanciness here, Google it and try to figure out what it is!
         * Let me know what you learn in #general-chill-chat
         */
        emit NewWave(msg.sender, block.timestamp, _message);
    }

    /*
     * I added a function getAllWaves which will return the struct array, waves, to us.
     * This will make it easy to retrieve the waves from our website!
     */
    function getAllWaves() public view returns (Wave[] memory) {
        return waves;
    }

    function getTotalWaves() public view returns (uint256) {
        // Optional: Add this line if you want to see the contract print the value!
        // We'll also print it over in run.js as well.
        console.log("We have %d total waves!", totalWaves);
        return totalWaves;
    }
}
```

## 🧐 Test it

Whenever we change our contract, we want to change run.js to test the new functionality we added. That's how we know it's working how we want! Here's what mine looks like now.

Here's my updated run.js. 

```js
const main = async () => {
  const waveContractFactory = await hre.ethers.getContractFactory('WavePortal');
  const waveContract = await waveContractFactory.deploy();
  await waveContract.deployed();
  console.log('Contract addy:', waveContract.address);

  let waveCount;
  waveCount = await waveContract.getTotalWaves();
  console.log(waveCount.toNumber());

  /**
   * Let's send a few waves!
   */
  let waveTxn = await waveContract.wave('A message!');
  await waveTxn.wait(); // Wait for the transaction to be mined

  const [_, randomPerson] = await hre.ethers.getSigners();
  waveTxn = await waveContract.connect(randomPerson).wave('Another message!');
  await waveTxn.wait(); // Wait for the transaction to be mined

  let allWaves = await waveContract.getAllWaves();
  console.log(allWaves);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
```

## ✈️ Re-deploy
So, now that we've updated our contract we need to do a few things:
1. We need to deploy it again `npx hardhat run scripts/deploy.js --network rinkeby`
2. We need to update the contract address on our frontend `contractAddress` in `App.js`
3. We need to update the abi file on our frontend. 

## 🔌 Hooking it all up to our client
So, here's the new function I added to App.js.

```jsx
const [currentAccount, setCurrentAccount] = useState("");
/*
  * All state property to store all waves
  */
const [allWaves, setAllWaves] = useState([]);
const contractAddress = "0xd5f08a0ae197482FA808cE84E00E97d940dBD26E";

/*
  * Create a method that gets all waves from your contract
  */
const getAllWaves = async () => {
  try {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      /*
        * Call the getAllWaves method from your Smart Contract
        */
      const waves = await wavePortalContract.getAllWaves();
      

      /*
        * We only need address, timestamp, and message in our UI so let's
        * pick those out
        */
      let wavesCleaned = [];
      waves.forEach(wave => {
        wavesCleaned.push({
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message
        });
      });

      /*
        * Store our data in React State
        */
      setAllWaves(wavesCleaned);
    } else {
      console.log("Ethereum object doesn't exist!")
    }
  } catch (error) {
    console.log(error);
  }
}
```

And the return:

```jsx
return (
  <div className="mainContainer">
    <div className="dataContainer">
      <div className="header">
        👋 Hey there!
      </div>

      <div className="bio">
        I am farza and I worked on self-driving cars so that's pretty cool right? Connect your Ethereum wallet and wave at me!
      </div>

      <button className="waveButton" onClick={wave}>
        Wave at Me
      </button>

      {!currentAccount && (
        <button className="waveButton" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}

      {allWaves.map((wave, index) => {
        return (
          <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
            <div>Address: {wave.address}</div>
            <div>Time: {wave.timestamp.toString()}</div>
            <div>Message: {wave.message}</div>
          </div>)
      })}
    </div>
  </div>
);
```

## 🙀 Ah!! wave() is broken!

```
const waveTxn = await wavePortalContract.wave("this is a message")
```

I'll leave this up you: figure out how to add a textbox that lets users add their own custom message they can send to the wave function :).
