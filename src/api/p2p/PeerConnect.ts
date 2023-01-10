import { CardanoPeerConnect } from '@fabianbormann/cardano-peer-connect';
import {Bytes, Cbor, Cip30DataSignature, Paginate} from "@fabianbormann/cardano-peer-connect/types";
import Meerkat from "@fabianbormann/meerkat";
import {
    setPeer, getPeer
} from "../../db";
import {extendMoment} from "moment-range";
import Moment from 'moment';
// @ts-ignore
const moment = extendMoment(Moment);

export class PeerConnect extends CardanoPeerConnect {

    private meerkat: Meerkat | undefined;
    id: string;
    apiVersion: string = '0.1.0';
    name: string = 'idWallet';
    icon: string = 'data:image/svg+xml,%3Csvg%20xmlns...';

    identity: {address:string, seed: string} = {
        address: '',
        seed: ''
    };

    constructor(name:string, config:{
        seed:string | undefined,
        identifier:string | undefined,
        announce:string[],
        messages?:string[]
    }) {

        super();

        this.name = name;

        this.meerkat = new Meerkat({
            seed: config.seed || undefined,
            identifier: config.identifier,
            announce: config.announce,
        });

        this.id = `${name}:${this.meerkat.identifier}`;

        setPeer(this.id, this.meerkat.seed, this.meerkat.identifier, name, this.meerkat.announce);

        let connected = false;
        this.meerkat.on('connections', () => {
            if (!connected) {
                connected = true;
                console.log('server ready');
            }
        });

        this.meerkat.register(
            'message',
            (address: string, message: string, callback: Function) => {
                try {
                    console.log(`[info]: message: ${message}`);
                    console.log(`[info]: sent by: ${address}`);
                    getPeer(this.id).then(host => {
                        setPeer(this.id, host.seed, host.identifier, name, host.announce, [...host.messages, message]).then(_ => {
                            callback(true);
                        });
                    });
                } catch (e) {
                    callback(false);
                }
            }
        );
    }

    /**
     * Send message to host
     *
     * @param identifier - The host identifier to send the message
     * @param name - The local channel name
     * @param message - The text message to send
     *
     */
    sendMessage(identifier: string, name: string, message: string): void {

        if(!this.meerkat) return;

        this.meerkat.rpc(
            identifier,
            'message',
            {
                message
            },
            (response:any) => {
                try {
                    console.log(`[info]: message: ${message}`);
                    console.log(`[info]: sent to: ${identifier}`);
                    getPeer(this.id).then(host => {
                        setPeer(
                            this.id,
                            host.seed,
                            host.identifier,
                            name,
                            host.announce,
                            [...host.messages, message]).then(_ => {});
                    });
                } catch (e) {

                }
            }
        );
    }

    getBalance(): Cbor {
        return '';
    }

    getChangeAddress(): Cbor {
        return '';
    }

    getCollateral(params?: { amount?: Cbor }): Cbor[] | null {
        return [''];
    }

    getNetworkId(): number {
        return 0;
    }

    getRewardAddresses(): Cbor[] {
        return [];
    }

    getUnusedAddresses(): Cbor[] {
        return [];
    }

    getUsedAddresses(): Cbor[] {
        return [];
    }

    getUtxos(amount?: Cbor, paginate?: Paginate): Cbor[] | null {
        return [''];
    }

    signData(addr: string, payload: Bytes): Cip30DataSignature {
        return {
            key: '',
            signature: ''
        };
    }

    signTx(tx: Cbor, partialSign: boolean): Cbor {
        return '';
    }

    submitTx(tx: Cbor): string {
        return "";
    }
}

