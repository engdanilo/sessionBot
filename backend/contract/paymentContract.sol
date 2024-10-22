// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SessionBotPayment {

    address public owner;
    IERC20 public usdtToken;
    uint256 public constant semesterPrice = 30*10**18; // 30 USDT em Wei

    // Evento que será emitido quando o pagamento ocorrer
    event PaymentReceived(address user, uint256 amount);
    event PaymentRejected(address user, uint256 amount);

    constructor(address _usdtTokenAddress) {
        owner = msg.sender;
        usdtToken = IERC20(_usdtTokenAddress);
    }

    // Função para receber pagamento em USDT
    function pay(uint256 _amount) public {
        if (_amount < semesterPrice) {
            //Rejeitar pagamento
            bool success = usdtToken.transferFrom(address(this), msg.sender, _amount);
            require(success, "Failed to transfer USDT");
            emit PaymentRejected(msg.sender, _amount);
        } else {
            // Transferir o USDT do usuário para o proprietário do contrato
            bool success = usdtToken.transferFrom(msg.sender, owner, _amount);
            require(success, "Failed to transfer USDT");
            emit PaymentReceived(msg.sender, _amount);
        }
    }
}