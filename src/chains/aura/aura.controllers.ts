import { Aura } from './aura';
import { AuraBalanceRequest, AuraPollRequest } from './aura.requests';
import { TokenValue, tokenValueToString } from '../../services/base';
// import {
//   HttpException,
//   TOKEN_NOT_SUPPORTED_ERROR_CODE,
//   TOKEN_NOT_SUPPORTED_ERROR_MESSAGE,
// } from '../../services/error-handler';
import {
  validateAuraBalanceRequest,
  validateAuraPollRequest,
} from './aura.validators';

const { decodeTxRaw } = require('@cosmjs/proto-signing');

export const toAuraBalances = (
  balances: Record<string, TokenValue>,
  tokenSymbols: Array<string>
): Record<string, string> => {
  const walletBalances: Record<string, string> = {};

  tokenSymbols.forEach((symbol) => {
    let balance = '0.0';

    if (balances[symbol]) {
      balance = tokenValueToString(balances[symbol]);
    }
    walletBalances[symbol] = balance;
  });

  return walletBalances;
};

export class AuraController {
  static async balances(aura: Aura, req: AuraBalanceRequest) {
    validateAuraBalanceRequest(req);

    const wallet = await aura.getWallet(req.address, 'aura');

    const { tokenSymbols } = req;

    // tokenSymbols.forEach((symbol: string) => {
    //   const token = cosmosish.getTokenForSymbol(symbol);

    //   if (!token) {
    //     throw new HttpException(
    //       500,
    //       TOKEN_NOT_SUPPORTED_ERROR_MESSAGE + symbol,
    //       TOKEN_NOT_SUPPORTED_ERROR_CODE
    //     );
    //   }
    // });

    const balances = await aura.getBalances(wallet);
    const filteredBalances = toAuraBalances(balances, tokenSymbols);

    return {
      balances: filteredBalances,
    };
  }

  static async poll(cosmos: Aura, req: AuraPollRequest) {
    validateAuraPollRequest(req);

    const transaction = await cosmos.getTransaction(req.txHash);
    const currentBlock = await cosmos.getCurrentBlockNumber();
    return {
      txHash: req.txHash,
      currentBlock,
      txBlock: transaction.height,
      gasUsed: transaction.gasUsed.toString(),
      gasWanted: transaction.gasWanted.toString(),
      txData: decodeTxRaw(transaction.tx),
      txStatus: transaction.code,
    };
  }
}
