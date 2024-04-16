import GhostnetTokens from '../../../../templates/lists/tezos.ghostnet.tokens.json';
import MainnetTokens from '../../../../templates/lists/tezos.mainnet.tokens.json';
import { DexTypeEnum } from 'swap-router-sdk';
import { ConnectType, QSNetwork, QSNetworkType, NetworkType, SupportedNetwork, Token } from '../shared/types';
import { mapBackendToken } from '../shared/backend.token.map';

export const KNOWN_DEX_TYPES = [
    DexTypeEnum.QuipuSwap,
    DexTypeEnum.QuipuSwapTokenToTokenDex,
    DexTypeEnum.QuipuSwapCurveLike,
    DexTypeEnum.QuipuSwap20,
    DexTypeEnum.QuipuSwapV3,
    DexTypeEnum.YupanaWtez
];

const tokenStandardiser = (token: typeof MainnetTokens.tokens[0]): Token => {
    // token.symbol = token.symbol.toUpperCase();
    // return token;
    return mapBackendToken({
        contractAddress: token.address ?? 'tez',
        type: token.standard,
        fa2TokenId: token.tokenId ?? undefined,
        metadata: {
            decimals: token.decimals,
            name: token.name,
            symbol: token.symbol.toUpperCase(),
        }
    })
};

const TOKENS_MAP = {
    [NetworkType.MAINNET]: {
        ...MainnetTokens,
        tokens: MainnetTokens.tokens.map(tokenStandardiser)
    },
    [NetworkType.GHOSTNET]: {
        ...GhostnetTokens,
        tokens: GhostnetTokens.tokens.map(tokenStandardiser)
    }
};

export const networkTokens = (network: SupportedNetwork) => TOKENS_MAP[network];

export const TEZ_TOKEN_MAINNET_WHITELISTED_POOLS_ADDRESSES = [
    'KT1K4EwTpbvYN9agJdjpyJm4ZZdhpUNKB3F6',
    'KT1WxgZ1ZSfMgmsSDDcUn8Xn577HwnQ7e1Lb',
    'KT1PL1YciLdwMbydt21Ax85iZXXyGSrKT2BE',
    'KT1KFszq8UFCcWxnXuhZPUyHT9FK3gjmSKm6',
    'KT1Ucg1fTZXBD8P426rTRXyu7YQUgYXV7RVu',
    'KT1EtjRRCBC2exyCRXz8UfV7jz7svnkqi7di',
    'KT1X3zxdTzPB9DgVzA3ad6dgZe9JEamoaeRy'
];

export const TOKEN_TOKEN_MAINNET_WHITELISTED_POOLS = [{ address: 'KT1VNEzpf631BLsdPJjt2ZhgUitR392x6cSi', id: 21 }];

const MAINNET_NETWORK: QSNetwork = {
    id: NetworkType.MAINNET as SupportedNetwork,
    connectType: ConnectType.DEFAULT,
    name: 'Mainnet',
    type: QSNetworkType.MAIN,
    disabled: false
};

const GHOSTNET_NETWORK: QSNetwork = {
    ...MAINNET_NETWORK,
    id: NetworkType.GHOSTNET as SupportedNetwork,
    name: 'Ghostnet',
    type: QSNetworkType.TEST
};

const networks = {
    [NetworkType.MAINNET]: MAINNET_NETWORK,
    [NetworkType.GHOSTNET]: GHOSTNET_NETWORK,
};

export const networkInfo = (network: SupportedNetwork) => networks[network];

export const STABLESWAP_REFERRAL = 'tz1Sw2mFAUzbkm7dkGCDrbeBsJTTtV7JD8Ey';
