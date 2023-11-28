export class AuraToken {
  decimals: number;
  symbol: string;
  name: string;
  address: string;
  type: string;
  base: string;
  coinDenom: string;

  public constructor(
    address: string,
    decimals: number,
    name: string,
    symbol: string,
    type: string,
    base: string,
    coinDenom: string
  ) {
    this.address = address;
    this.decimals = decimals;
    this.name = name;
    this.symbol = symbol;
    this.type = type;
    this.base = base;
    this.coinDenom = coinDenom;
  }
}

export class AuraPool {
  name: string;
  address: string;
  asset1Address: string;
  asset2Address: string;

  public constructor(
    address: string,
    name: string,
    asset1Address: string,
    asset2Address: string
  ) {
    this.address = address;
    this.name = name;
    this.asset1Address = asset1Address;
    this.asset2Address = asset2Address;
  }
}
