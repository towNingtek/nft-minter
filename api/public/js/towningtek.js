import {
    ethers
} from "./ethers-5.6.9.esm.min.js";

export {
    connectWalletConnect,
    disconnectWalletConnect,
    connectMetaMask,
    purchase,
    getRemainder,
};

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
let web3Modal;
let externalProvider = null;
let provider = null;

async function connectWalletConnect() {
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                infuraId: infuraId,
            }
        }
    };
    web3Modal = new Web3Modal({
        // Reference:
        // https://github.com/WalletConnect/web3modal#optional-flags
        cacheProvider: false, // optional
        providerOptions, // required
        disableInjectedProvider: true, // optional. For MetaMask, set false
    });
    externalProvider = await web3Modal.connect().catch(function(error) {
        console.log("Could not get a wallet connection", error);
        return;
    });

    provider = new ethers.providers.Web3Provider(externalProvider);
    // document.getElementById("message").innerHTML = '<b style="color:blue; background-color:black; padding: 0.3em;">WalletConnect connected.</b>';
    walletStatus();
}

async function disconnectWalletConnect() {
    await connectWalletConnect();
    if (externalProvider.close) {
	await externalProvider.close();
        await web3Modal.clearCachedProvider();
        externalProvider = null;
        provider = null;
    }
    // document.getElementById("message").innerHTML = '<b style="color:blue; background-color:black; padding: 0.3em;">Wallet disconnected.</b>';
    walletStatus();
}

// Connect MetaMask wallet and return the provider
async function connectMetaMask() {
    // Set up connection with MetaMask
    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
    } catch (error) {
        console.error(error);
        console.error("Please install MetaMask.");
        throw error;
    }

    // Require user to add and switch to the correct blockchain
    // Use wallet_switchEthereumChain instead of wallet_addEthereumChain since Ethereum is in the default chain
    await provider.send("wallet_switchEthereumChain", chainConfig).catch(function(error) {
        console.error(error);
        throw error;
    })
    // Assign new provider with new chain
    provider = new ethers.providers.Web3Provider(window.ethereum);

    // Require user to select wallet account
    const currentAddr = await provider.send("eth_requestAccounts", []).catch(function(error) {
        if (error.code === 4001) { // EIP-1193 userRejectedRequest error
            console.error("Please connect to MetaMask.");
        } else {
            console.error(error);
        }
        throw error;
    });

    walletStatus();
    console.log("The current wallet address is :", currentAddr[0]);
    console.log("Connecting wallet is successful.");
    // document.getElementById("message").innerHTML = '<b style="color:blue; background-color:black; padding: 0.3em;">MetaMask connected.</b>';
}

// Interact with smart contract and buy NFT
async function purchase() {
   // Check provider
    if (provider == null) {
        document.getElementById("message").innerHTML = '<b style="color:blue; background-color:black; padding: 0.3em;">The wallet is not connected</b>';
        console.error("The wallet is not connected");
        return;
    }

    const signer = provider.getSigner();

    // Call contract function for buying NFTs
    console.log("contract address: " + contractAddr);
    let response;
    const signerAddr = await signer.getAddress();
    const contract = new ethers.Contract(contractAddr, abi, signer);
    const check = await contract.callStatic.safeMint(signerAddr, 0).catch(function(error) {
        document.getElementById("message").innerHTML = '<b style="color:blue; background-color:black; padding: 0.3em;">' + error.reason + '</b>';
        console.error("Contract error: " + error);
        console.error(error.reason);
        throw error;
    });
    response = await contract.safeMint(signerAddr, 0).catch(function(error) {
        console.error("Contract error: " + error);
        document.getElementById("message").innerHTML = '<b style="color:blue; background-color:black; padding: 0.3em;">' + error.reason + '</b>';
        throw error;
    });
   // Wait for transaction to be confirmed
    let receipt;
    let price;
    let replacedTx = true;
    let products = new Object();
    while (replacedTx) {
        await response.wait().then(function(result) {
            receipt = result;
            replacedTx = false;
        }).catch(function(error) {
            console.log(error.reason);
            if (error.cancelled)
                throw error;
            response = error.replacement;
        });
    }

    // Grab log for events
    // ERC721 NFT transfer
    const transactionHash = receipt.transactionHash
    for (let i = 0; i < receipt.logs.length; i++) {
        if (
            receipt.logs[i].topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
            receipt.logs[i].topics[1] == "0x0000000000000000000000000000000000000000000000000000000000000000") {
            const tokenId = parseInt(receipt.logs[i].topics[3], 16);
            products[tokenId] = transactionHash;
        }
    }

    console.log("purchase transaction hash: " + transactionHash);
    console.log("purchase finished");
    document.getElementById("message").innerHTML = '<b style="color:blue; background-color:black; padding: 0.3em;">purchase finished.</b>';
}

// Get the remainder of the available NFTs
async function getRemainder() {
    const provider = ethers.getDefaultProvider(rpcService);
    const contract = new ethers.Contract(contractAddr, abi, provider);
    // BigNumber objects
    const nextId = await contract.nextTokenId();
    const maxId = await contract.maxPurchaseId();
    const remainder = maxId.toNumber() - (nextId.toNumber() - 1);

    console.log(remainder);
    return remainder;
}

// Show the status of wallet connection
function walletStatus() {
    if (provider === null) {
        document.getElementById("message").innerHTML = '<b style="color:blue; background-color:black; padding: 0.3em;">Wallet disconnected.</b>';
	console.log("Disonnected");
    } else {
	document.getElementById("message").innerHTML = '<b style="color:blue; background-color:black; padding: 0.3em;">Wallet connect.</b>';
        console.log("Connected");
    }
}

walletStatus();
