import { TokenListType } from '../../services/base';
import { ConfigManagerV2 } from '../../services/config-manager-v2';
export interface NetworkConfig {
  name: string;
  nodeURL: string;
  tokenListType: TokenListType;
  tokenListSource: string;
  routerAddress: string;
  defaultGasPrice: string;
}

export interface Config {
  network: NetworkConfig;
  nativeCurrencySymbol: string;
  manualGasPrice: number;
}

export namespace AuraConfig {
  export const config: Config = getAuraConfig('aura');
}

export function getAuraConfig(chainName: string): Config {
  const configManager = ConfigManagerV2.getInstance();
  const network = configManager.get(chainName + '.network');
  return {
    network: {
      name: network,
      nodeURL: configManager.get(
        chainName + '.networks.' + network + '.nodeURL'
      ),
      tokenListType: configManager.get(
        chainName + '.networks.' + network + '.tokenListType'
      ),
      tokenListSource: configManager.get(
        chainName + '.networks.' + network + '.tokenListSource'
      ),
      routerAddress: configManager.get(
        chainName + '.networks.' + network + '.routerAddress'
      ),
      defaultGasPrice: configManager.get(
        chainName + '.networks.' + network + '.defaultGasPrice'
      ),
    },
    nativeCurrencySymbol: configManager.get(
      chainName + '.nativeCurrencySymbol'
    ),
    manualGasPrice: configManager.get(chainName + '.manualGasPrice'),
  };
}
