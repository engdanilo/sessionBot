const { ethers } = require('ethers');
const SessionBotPayment = require('../contracts/SessionBotPayment.json');
const dotenv = require('dotenv');
dotenv.config();

// Provedor da rede BSC
const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

// Endereço do contrato implantado na rede BSC
const contractAddress = process.env.CONTRACT_ADDRESS; // Substituir pelo endereço real do contrato

// ABI do contrato
const abi = SessionBotPayment.abi; 

// Criar uma instância do contrato
const contract = new ethers.Contract(
  contractAddress,
  abi,
  provider
);

const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id; // ID do usuário no Telegram
    const amount = ethers.utils.parseUnits('30', 18); // 30 USDT (18 casas decimais)

    // Obter o endereço da sua carteira Metamask do arquivo .env
    const ownerAddress = process.env.METAMASK_ADDRESS;

    // Gerar a transação para o usuário aprovar
    // O pagamento será enviado para ownerAddress
    const transaction = await contract.populateTransaction.pay(amount, {
      from: userId,  // Endereço do usuário que fará o pagamento
      to: ownerAddress // Endereço da sua carteira Metamask
    });

    res.json({
      ...transaction,
      to: contractAddress,
      value: 0, // Não enviar ETH junto
    });

  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = { createPaymentIntent };