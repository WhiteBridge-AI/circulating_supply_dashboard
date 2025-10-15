const NodeCache = require('node-cache');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 3000;

// BSCSCAN API Key (ENV)
const apiKey = process.env.BSCSCAN_API_KEY;

// Contract address of CGPT token (ENV)
const cgptContractAddress = process.env.CGPT_CONTRACT_ADDRESS;

// Maximum Supply of CGPT token (ENV)
const MaxSupply = process.env.CGPT_MAX_SUPPLY;

const cache = new NodeCache({ stdTTL: 600 }); // Set the cache expiration time to 600 seconds (10 minutes)

// List of contract addresses with additional information
const contractAddresses = [
  {
    address: '0xa555b81736a9b1376dfcaa3bcbbeb56da4882b11',
    chain: 'BSC',
    type: 'ChainGPT Pad IDO Vesting',
    wallet: 'IDO Round (ref: tokenomics)', 
  },
    {
    address: '0x7292d76f371dF773d5BAeAe038b4281fF3f33215',
    chain: 'BSC',
    type: 'Trust, Zealy, Airdrops',
    wallet: 'Airdrop Round (ref: tokenomics)', 
  },
    {
    address: '0x7ae1705cdae974a9dfc165fe01cbeab646ab5296',
    chain: 'BSC',
    type: 'TeamFinance Vesting',
    wallet: 'Liquidity Round (ref: tokenomics)', 
  },
    {
    address: '0x549d26f0f827a7e13f9f9a7defc30542af754c40',
    chain: 'BSC',
    type: 'TeamFinance Vesting',
    wallet: 'Pre-Seed Round (ref: tokenomics)', 
  },
    {
    address: '0xab954a5f63e6543f7b7768ce2318d2e8f0c27742',
    chain: 'BSC',
    type: 'TeamFinance Vesting',
    wallet: 'Seed Round (ref: tokenomics)', 
  },
    {
    address: '0x5af9e219c222670ea308ed028888862e38467eb1',
    chain: 'BSC',
    type: 'TeamFinance Vesting',
    wallet: 'Team Round (ref: tokenomics)', 
  },
    {
    address: '0x3666749f39bc5e92bdc44b8ef5f63fdb70b7aadc',
    chain: 'BSC',
    type: 'TeamFinance Vesting',
    wallet: 'Advisors Round (ref: tokenomics)', 
  },
    {
    address: '0x162e2ace8563a62dd4c5e85d775b51275fefb023',
    chain: 'BSC',
    type: 'TeamFinance Vesting',
    wallet: 'Early-Supporters Round (ref: tokenomics)', 
  },
    {
    address: '0xca2297fd2b8acd4b064ed5a279f7575d0801ddc8',
    chain: 'BSC',
    type: 'TeamFinance Vesting',
    wallet: 'Development & Marketing Round (ref: tokenomics)', 
  },
    {
    address: '0x9b11579c3f43cbf9a21d1e2dd290c7b76f497224',
    chain: 'BSC',
    type: 'TeamFinance Vesting',
    wallet: 'Ecosystem Incentives Round (ref: tokenomics)', 
  },
    {
    address: '0xd00332c4c11301d23012d3cd883afa02603476f1',
    chain: 'BSC',
    type: 'Decubate Vesting',
    wallet: 'Misc: KOLs, Airdrops, other (ref: tokenomics)', 
  },
];

async function getTotalSupply() {
  const cachedTotalSupply = cache.get('totalSupply');
  if (cachedTotalSupply !== undefined) {
    return cachedTotalSupply;
  }

  try {
    const url = `https://api.etherscan.io/v2/api?chainid=56&module=stats&action=tokensupply&contractaddress=${cgptContractAddress}&apikey=${apiKey}`;
    const response = await axios.get(url);
    const result = response.data.result;

    cache.set('totalSupply', result); // Cache the total supply

    return result;
  } catch (error) {
    console.error('Error fetching total supply:', error);
    throw error;
  }
}

// This is the home-page URL that will show a detailed list of the excluded addresses from the supply and all the data such as total supply, burnt supply, circulating supply, etc.
app.get('/', async (req, res) => {
  const cachedBalances = cache.get('balances');
  if (cachedBalances !== undefined) {
    res.send(cachedBalances);
    return;
  }

  try {
    const balances = [];

    for (const { address, chain, type, wallet, name } of contractAddresses) {
      
        await new Promise(resolve => setTimeout(resolve, 250));

      const url = `https://api.etherscan.io/v2/api?chainid=56&module=account&action=tokenbalance&contractaddress=${cgptContractAddress}&address=${address}&tag=latest&apikey=${apiKey}`;
      const response = await axios.get(url);
      const balance = parseInt(response.data.result);

      balances.push({ address, balance, chain, type, wallet, name });
    }

    balances.sort((a, b) => b.balance - a.balance); // Sort balances in descending order

    let totalBalance = 0;
    
    let tableRows = '';

    for (const { address, balance, chain, type, wallet } of balances) {
      totalBalance += balance;
      const bscScanLink = `https://bscscan.com/token/${cgptContractAddress}?a=${address}`;
 
      tableRows += `<tr>
      <td><a href="${bscScanLink}" target="_blank">${address}</a></td>
        <td>${Math.floor(balance / 10 ** 18).toLocaleString()}</td>
        <td>${chain}</td>
        <td>${type}</td>
        <td>${wallet}</td>
      </tr>`;
    }

    const totalSupplyEndpointResult = await getTotalSupply();
    const burntTokens = MaxSupply - Math.floor(totalSupplyEndpointResult / 10 ** 18);
    const totalSupply = MaxSupply - Math.floor(totalBalance / 10 ** 18) - burntTokens;

    const htmlResponse = ` <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
  
    h1 {
      color: #333;
      font-size: 32px;
      margin-bottom: 20px;
      text-align: center;
    }
  
    p {
      color: #666;
      font-size: 16px;
      margin-bottom: 10px;
    }
  
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      background-color: #fff;
    }
  
    th,
    td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
  
    th {
      background-color: #f9f9f9;
      font-weight: bold;
      font-size: 16px;
    }
  
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
  
    a {
      color: #337ab7;
      text-decoration: underline;
    }
  
    a:hover {
      color: #23527c;
    }
  
    .title-row {
      background-color: #333;
      color: black;
      font-weight: bold;
      font-size: 18px;
    }
  
    .total-supply-row {
      background-color: #f9f9f9;
    }
  
    .empty-row {
      background-color: transparent;
    }
  
    /* Responsive Styles */
    @media screen and (max-width: 600px) {
      h1 {
        font-size: 24px;
      }
  
      p {
        font-size: 14px;
      }
  
      th,
      td {
        padding: 8px;
      }
    }
  </style>
  
  <h1>$WBAI Circulating Supply Tracker</h1>
  <p>Total Supply: 1,000,000,000</p>
  <p>Burnt $WBAI: ${burntTokens.toLocaleString()}</p>
  <p>Live Circulating Supply of $WBAI: ${totalSupply.toLocaleString()} </p>
  <br><br>
  <table>
    <tr class="title-row">
      <th>Contract Address</th>
      <th>Balance (CGPT)</th>
      <th>Chain</th>
      <th>Type</th>
      <th>Name</th>
    </tr>
    ${tableRows}
    <tr class="empty-row">
      <td colspan="5"></td>
    </tr>
    <tr class="total-supply-row">
      <td>$WBAI Circulating Supply</td>
      <td>${totalSupply.toLocaleString()}</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  </table>

    `;

    cache.set('balances', htmlResponse); // Cache the response

    res.send(htmlResponse);
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});



// This is an API endpoint that will show only the number of the circulating supply (normally used for CMC supply tracking)
app.get('/supply', async (req, res) => {
  const cachedSupply = cache.get('supply');
  if (cachedSupply !== undefined) {
    res.send(cachedSupply);
    return;
  }

  try {
    const balances = [];

    for (const { address, chain, type, wallet, name } of contractAddresses) {
      // Introduce a delay of 250ms (1 second / 4) between each API call
      await new Promise(resolve => setTimeout(resolve, 250));

      const url = `https://api.etherscan.io/v2/api?chainid=56&module=account&action=tokenbalance&contractaddress=${cgptContractAddress}&address=${address}&tag=latest&apikey=${apiKey}`;
      const response = await axios.get(url);
      const balance = parseInt(response.data.result);

      balances.push({ address, balance, chain, type, wallet, name });
    }

    balances.sort((a, b) => b.balance - a.balance); // Sort balances in descending order

    let totalBalance = 0;
    let tableRows = '';

    for (const { address, balance, chain, type, wallet } of balances) {
      totalBalance += balance;
      tableRows += `<tr>
        <td>${address}</td>
        <td>${Math.floor(balance / 10 ** 18)}</td>
        <td>${chain}</td>
        <td>${type}</td>
        <td>${wallet}</td>
      </tr>`;
    }

    const totalSupplyEndpointResult = await getTotalSupply();
    const burntTokens = MaxSupply - Math.floor(totalSupplyEndpointResult / 10 ** 18);
    const totalSupply = MaxSupply - Math.floor(totalBalance / 10 ** 18) - burntTokens;

    const htmlResponse = `${totalSupply}`;

    cache.set('supply', htmlResponse); // Cache the supply response

    res.send(htmlResponse);
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});


// This API endpoint will show the total supply
app.get('/totalsupply', async (req, res) => {
  const cachedSupply = cache.get('newtotal');
  if (cachedSupply !== undefined) {
    res.send(cachedSupply);
    return;
  }

  try {
    const balances = [];

    for (const { address, chain, type, wallet, name } of contractAddresses) {
        await new Promise(resolve => setTimeout(resolve, 250));

      const url = `https://api.etherscan.io/v2/api?chainid=56&module=account&action=tokenbalance&contractaddress=${cgptContractAddress}&address=${address}&tag=latest&apikey=${apiKey}`;
      const response = await axios.get(url);
      const balance = parseInt(response.data.result);

      balances.push({ address, balance, chain, type, wallet, name });
    }

    balances.sort((a, b) => b.balance - a.balance); // Sort balances in descending order

    let totalBalance = 0;
    let tableRows = '';

    for (const { address, balance, chain, type, wallet } of balances) {
      totalBalance += balance;
      tableRows += `<tr>
        <td>${address}</td>
        <td>${Math.floor(balance / 10 ** 18)}</td>
        <td>${chain}</td>
        <td>${type}</td>
        <td>${wallet}</td>
      </tr>`;
    }

    const totalSupplyEndpointResult = await getTotalSupply();
    const burntTokens = MaxSupply - Math.floor(totalSupplyEndpointResult / 10 ** 18);
    const totalSupply = MaxSupply - Math.floor(totalBalance / 10 ** 18) - burntTokens;
    const newTotalS = MaxSupply - burntTokens; 
    const htmlResponse = `${newTotalS}`;

    cache.set('newtotal', htmlResponse); // Cache the newtotal response

    res.send(htmlResponse);
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});



// This API endpoint will show the total tokens burnt
app.get('/burn', async (req, res) => {
  const cachedSupply = cache.get('burn');
  if (cachedSupply !== undefined) {
    res.send(cachedSupply);
    return;
  }

  try {
    const balances = [];

    for (const { address, chain, type, wallet, name } of contractAddresses) {
        await new Promise(resolve => setTimeout(resolve, 250));

      const url = `https://api.etherscan.io/v2/api?chainid=56&module=account&action=tokenbalance&contractaddress=${cgptContractAddress}&address=${address}&tag=latest&apikey=${apiKey}`;
      const response = await axios.get(url);
      const balance = parseInt(response.data.result);

      balances.push({ address, balance, chain, type, wallet, name });
    }

    balances.sort((a, b) => b.balance - a.balance); // Sort balances in descending order

    let totalBalance = 0;
    let tableRows = '';

    for (const { address, balance, chain, type, wallet } of balances) {
      totalBalance += balance;
      tableRows += `<tr>
        <td>${address}</td>
        <td>${Math.floor(balance / 10 ** 18).toLocaleString()}</td>
        <td>${chain}</td>
        <td>${type}</td>
        <td>${wallet}</td>
      </tr>`;
    }

    const totalSupplyEndpointResult = await getTotalSupply();
    const burntTokens = MaxSupply - Math.floor(totalSupplyEndpointResult / 10 ** 18);
    const totalSupply = MaxSupply - Math.floor(totalBalance / 10 ** 18) - burntTokens;

    const htmlResponse = `${burntTokens.toLocaleString()}`;

    cache.set('burn', htmlResponse); // Cache the burn response

    res.send(htmlResponse);
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
