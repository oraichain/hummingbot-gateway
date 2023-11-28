import { Auraish } from '../../services/common-interfaces';
import { AuraBase } from './aura-base';
import { getAuraConfig } from './aura.config';
import { logger } from '../../services/logger';
import { AuraController } from './aura.controllers';
import { HalotradeConfig } from '../../connectors/halotrade/halotrade.config';

export class Aura extends AuraBase implements Auraish {
  private static _instances: { [name: string]: Aura };
  private _gasPrice: number;
  private _nativeTokenSymbol: string;
  private _chain: string;
  private _requestCount: number;
  private _metricsLogInterval: number;
  private _metricTimer;
  private _routerAddress;
  private _defaultGasPrice;
  public controller;

  private constructor(network: string) {
    const config = getAuraConfig('aura');
    super(
      'aura',
      config.network.nodeURL,
      config.network.tokenListSource,
      config.network.tokenListType,
      config.manualGasPrice
    );
    this._chain = network;
    this._nativeTokenSymbol = config.nativeCurrencySymbol;
    this._routerAddress = config.network.routerAddress;
    this._defaultGasPrice = config.network.defaultGasPrice;
    this._gasPrice = config.manualGasPrice;

    this._requestCount = 0;
    this._metricsLogInterval = 300000; // 5 minutes

    this._metricTimer = setInterval(
      this.metricLogger.bind(this),
      this.metricsLogInterval
    );
    this.controller = AuraController;
  }

  public static getInstance(network: string): Aura {
    if (Aura._instances === undefined) {
      Aura._instances = {};
    }
    if (!(network in Aura._instances)) {
      Aura._instances[network] = new Aura(network);
    }
    return Aura._instances[network];
  }

  public static getConnectedInstances(): { [name: string]: Aura } {
    return Aura._instances;
  }

  public requestCounter(msg: any): void {
    if (msg.action === 'request') this._requestCount += 1;
  }

  public metricLogger(): void {
    logger.info(
      this.requestCount +
        ' request(s) sent in last ' +
        this.metricsLogInterval / 1000 +
        ' seconds.'
    );
    this._requestCount = 0; // reset
  }

  public get gasPrice(): number {
    return this._gasPrice;
  }

  public get chain(): string {
    return this._chain;
  }

  public get nativeTokenSymbol(): string {
    return this._nativeTokenSymbol;
  }

  public get requestCount(): number {
    return this._requestCount;
  }

  public get metricsLogInterval(): number {
    return this._metricsLogInterval;
  }

  public get routerAddress(): string {
    return this._routerAddress;
  }

  public get defaultGasPrice(): string {
    return this._defaultGasPrice;
  }

  async close() {
    clearInterval(this._metricTimer);
    if (this._chain in Aura._instances) {
      delete Aura._instances[this._chain];
    }
  }

  getSpender(reqSpender: string): string {
    let spender: string;
    if (reqSpender === 'halotrade') {
      spender = HalotradeConfig.config.routerAddress(this._chain);
    } else {
      spender = '';
    }
    return spender;
  }
}
