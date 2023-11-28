import { buildConfig, NetworkConfig } from '../../network/network.utils';

export namespace HalotradeConfig {
  export const config: NetworkConfig = buildConfig(
    'aura',
    ['AMM'],
    [{ chain: 'aura', networks: ['xstaxy', 'euphoria'] }],
    'aura'
  );
}
