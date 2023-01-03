import { createLogger, format, transports } from "winston";
var amqp = require('amqplib');
import { nftAbi } from "./constant/abi";
import * as configs from "./configs/configs";
const Web3 = require('web3');

const minterInformation = {
  name: "Minter",
  address: configs.NFT_OWNER_ADDRESS,
  privateKey: configs.NFT_OWNER_PRIVATE_KEY,
  gas: {
    gas:500000,
    baseFeePerGas: 100000000000,
    maxFeePerGas: 200000000000,
    maxPriorityFeePerGas: 100000000000,
  },
};

const logger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.prettyPrint()
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: `logs/${configs.EVENT_NAME}/${minterInformation.name}.log`,
    }),
  ],
});

async function minter(receiverAddress: string) {
  try {
    logger.info(`[${minterInformation.name}] Ready to mint something`);
    logger.info(
      `[${minterInformation.name}] NFT Contract: ${configs.NFT_CONTRACT_ADDRESS}`
    );

    const connection = await amqp.connect("amqp://localhost/nft");
    const channel = await connection.createChannel();
    await channel.assertQueue('minter', {
      durable: false
    });

    
    channel.prefetch(1);

    channel.consume('minter', async (message: any) => {
    console.log(message.content.toString());
    /*
    const orderObject = JSON.parse(message.content.toString());

      logger.info(
        `[${minterInformation.name}][Queue]: ${
          'minter'
	} --> ${message.content.toString()}`
      );
     */
    await mint(message.content.toString());

      console.log("from queue" +message);
      channel.ack(message);
    });
  } catch (err) {
    logger.error(err);
  }
}

const mint = async (address: string) => {
  // const web3 = new Web3(new Web3.providers.HttpProvider("https://rpc-mumbai.maticvigil.com/"));
  const web3 = new Web3(new Web3.providers.HttpProvider(configs.WEB3_PROVIDER));
  const contract = new web3.eth.Contract(nftAbi, {
    from: configs.NFT_OWNER_ADDRESS, // default from address
    gasPrice: '20000000000' // default gas price in wei, 20 gwei in this case
  });

  web3.eth.accounts.wallet.add(configs.NFT_OWNER_PRIVATE_KEY);
  const networkId = await web3.eth.net.getId()
  const nftContract = new web3.eth.Contract(
    // @ts-ignore
    nftAbi,
    configs.NFT_CONTRACT_ADDRESS
  );

  const tx = nftContract.methods.safeMint(address, 0);//, configs.TOKEN_URI)
  const gas = await tx.estimateGas({from: configs.NFT_OWNER_ADDRESS})

  const gasPrice = await web3.eth.getGasPrice()
  const data = tx.encodeABI()
  const nonce = await web3.eth.getTransactionCount(configs.NFT_OWNER_ADDRESS)

  const signedTx = await web3.eth.accounts.signTransaction({
    to:nftContract.options.address,
    data,
    gas,
    gasPrice,
    nonce,
    chainId:networkId
  },
  configs.NFT_OWNER_PRIVATE_KEY)

  const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
  console.log(`transaction hash: ${receipt.transactionHash}`)
};

minter(configs.NFT_OWNER_ADDRESS);
