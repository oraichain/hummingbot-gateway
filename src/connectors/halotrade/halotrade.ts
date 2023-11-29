// import { AccountData } from '@cosmjs/proto-signing';
// import { IndexedTx } from '@cosmjs/stargate';
// import { AuraToken, Token } from '../../chains/aura/aura-base';
// import { AuraToken } from '../../chains/aura/aura-token';
// import { TokenListType, TokenValue } from '../../services/base';
// import {
// ExpectedTrade,
// ExpectedTrade,
// Halotradish,
// RefAMMish,
// Tokenish,
// UniswapishTrade,
// } from '../../services/common-interfaces';
import { HalotradeConfig } from './halotrade.config';
import { toUtf8, toBase64 } from '@cosmjs/encoding';
import {
  SigningCosmWasmClient,
  MsgExecuteContractEncodeObject,
} from 'cosmjs-cosmwasm-stargate-0.32';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
// import { logger } from '../../services/logger';
import { Aura } from '../../chains/aura/aura';
// import { ContractInterface, BigNumber, Wallet, Transaction } from 'ethers';
import { AuraPool, AuraToken } from '../../chains/aura/aura-token';
import { PriceRequest, TradeRequest } from '../../amm/amm.requests';
import {
  HttpException,
  TOKEN_NOT_SUPPORTED_ERROR_CODE,
  TOKEN_NOT_SUPPORTED_ERROR_MESSAGE,
} from '../../services/error-handler';
import { DirectSecp256k1Wallet } from 'cosmjs-proto-signing-0.32';
import { GasPrice } from 'cosmjs-stargate-0.32';
// import e from 'express';
// import { pow } from 'mathjs';

export class Halotrade {
  private static _instances: { [name: string]: Halotrade };
  router: string = '';
  gasLimitEstimate: number;
  chainId: string;
  private tokenList: Record<string, AuraToken> = {};
  private poolList: Record<string, AuraPool> = {};
  private aura: Aura;
  private _ready: boolean = false;
  private constructor(network: string) {
    const config = HalotradeConfig.config;
    this.aura = Aura.getInstance(network);
    this.chainId = this.aura.chain;
    this.router = this.aura.routerAddress;
    this.gasLimitEstimate = config.gasLimitEstimate;
  }

  async init(): Promise<void> {
    if (!this.aura.ready()) {
      await this.aura.init();
    }
    for (const token of this.aura.storedTokenList) {
      const name = token.name;
      this.tokenList[name] = token;
    }

    for (const pool of this.aura.storedTokenPool) {
      const name = pool.name;
      this.poolList[name] = pool;
    }
    this._ready = true;
  }

  public static getInstance(chain: string, network: string): Halotrade {
    if (Halotrade._instances === undefined) {
      Halotrade._instances = {};
    }
    if (!(chain + network in Halotrade._instances)) {
      Halotrade._instances[chain + network] = new Halotrade(network);
    }

    return Halotrade._instances[chain + network];
  }

  ready(): boolean {
    return this._ready;
  }

  buildMessage(baseToken: AuraToken, quoteToken: AuraToken): string {
    let baseType;
    let quoteType;
    if (baseToken.type === 'ibc' || baseToken.type === 'native') {
      baseType = 'native_token';
      // offerAssetInfo = ` "offer_asset_info": {"native_token": {"denom": "${baseToken.address}"}} `;
    } else {
      baseType = 'token';
    }
    if (quoteToken.type === 'ibc' || quoteToken.type === 'native') {
      quoteType = 'native_token';
    } else {
      quoteType = 'token';
    }
    const msg = `
    [
      {
        "halo_swap": {
          "offer_asset_info": {
            "${baseType}": {
              "${baseType === 'native_token' ? 'denom' : 'contract_addr'}": "${
      baseToken.address
    }"
            }
          },
          "ask_asset_info": {
            "${quoteType}": {
              "${quoteType === 'native_token' ? 'denom' : 'contract_addr'}": "${
      quoteToken.address
    }"
            }
          }
        }
      }
    ]
    `;
    return msg;
  }

  async estimateTrade(req: PriceRequest) {
    const baseToken = this.tokenList[req.base];
    const quoteToken = this.tokenList[req.quote];
    if (baseToken === null || quoteToken === null)
      throw new HttpException(
        500,
        TOKEN_NOT_SUPPORTED_ERROR_MESSAGE,
        TOKEN_NOT_SUPPORTED_ERROR_CODE
      );

    const msg = this.buildMessage(baseToken, quoteToken);
    // console.log(msg);
    const cosmwasmClient: SigningCosmWasmClient = await this.aura
      ._cosmwasmClient;
    const result = await cosmwasmClient.queryContractSmart(this.router, {
      simulate_swap_operations: {
        operations: JSON.parse(msg),
        offer_amount: req.amount,
      },
    });
    return result?.amount;
  }

  async trade(req: TradeRequest, isEstimated: boolean) {
    const walletFile = await this.aura.getWallet(req.address, 'aura');
    const wallet = await DirectSecp256k1Wallet.fromKey(
      walletFile.privkey,
      'aura'
    );

    const signingClient = await SigningCosmWasmClient.connectWithSigner(
      this.aura.rpcUrl,
      wallet,
      {
        broadcastPollIntervalMs: 300,
        broadcastTimeoutMs: 8_000,
        gasPrice: GasPrice.fromString(this.aura.defaultGasPrice),
      }
    );

    const estimatedTrade = await this.estimateTrade(req);
    const baseToken = this.tokenList[req.base];
    const quoteToken = this.tokenList[req.quote];
    if (baseToken === null || quoteToken === null)
      throw new HttpException(
        500,
        TOKEN_NOT_SUPPORTED_ERROR_MESSAGE,
        TOKEN_NOT_SUPPORTED_ERROR_CODE
      );
    let msg = {
      execute_swap_operations: {
        operations: JSON.parse(this.buildMessage(baseToken, quoteToken)),
        minimum_receive: estimatedTrade,
      },
    };
    let contract = '';
    const funds = [];
    if (
      (baseToken.type === 'native' || baseToken.type === 'ibc') &&
      quoteToken.type === 'cw20'
    ) {
      contract = this.router;
      funds.push({
        denom: baseToken.address,
        amount: req.amount,
      });
    } else if (
      baseToken.type === 'cw20' &&
      (quoteToken.type === 'native' || quoteToken.type === 'ibc')
    ) {
      const msgNested = msg;
      const msgNestedBase64 = toBase64(toUtf8(JSON.stringify(msgNested)));
      msg = JSON.parse(`{
        "send": {
           "contract": "${this.router}",
           "amount": "${req.amount}",
           "msg": "${msgNestedBase64}"
        }
      }`);
      contract = baseToken.address;
    }

    const executeContractMsg: MsgExecuteContractEncodeObject = {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.fromPartial({
        sender: req.address,
        contract: contract,
        msg: toUtf8(JSON.stringify(msg)),
        funds: funds,
      }),
    };
    const memo = 'swap from hummingbot';
    if (isEstimated) {
      const gasUsed = await signingClient.simulate(
        req.address,
        [executeContractMsg],
        memo
      );
      console.log(gasUsed);
      return { gasUsed };
    } else {
      const result = await signingClient.signAndBroadcast(
        req.address,
        [executeContractMsg],
        'auto',
        memo
      );
      return {
        txhash: result.transactionHash,
        expectedPrice: 0,
        expectedAmount: 0,
      };
    }
  }

  async price(req: PriceRequest) {
    const baseToken = this.tokenList[req.base];
    const quoteToken = this.tokenList[req.quote];
    const foundPool = this.poolList[`${baseToken.name}-${quoteToken.name}`];
    if (!foundPool) {
      return null;
    }
    const cosmwasmClient: SigningCosmWasmClient = await this.aura
      ._cosmwasmClient;
    const result = await cosmwasmClient.queryContractSmart(foundPool.address, {
      pool: {},
    });
    console.log(result?.asset);
    let amountBaseToken = '0';
    let amountQuoteToken = '0';
    result?.assets.forEach((asset: any) => {
      if (
        asset.info?.token?.contract_addr === baseToken.address ||
        asset.info?.native_token?.denom === baseToken.address
      ) {
        amountBaseToken = asset.amount;
      }
      if (
        asset.info?.token?.contract_addr === quoteToken.address ||
        asset.info?.native_token?.denom === quoteToken.address
      ) {
        amountQuoteToken = asset.amount;
      }
    });
    const expectedPrice =
      req.side === 'SELL'
        ? Number(amountBaseToken) / Number(amountQuoteToken)
        : Number(amountQuoteToken) / Number(amountBaseToken);
    const expectedAmount =
      req.side === 'SELL'
        ? Number(req.amount)
        : expectedPrice * Number(req.amount);
    return { expectedAmount, expectedPrice };
    // return result?.amount;
  }
}
