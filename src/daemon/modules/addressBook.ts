import {Zcoind} from "../zcoind";

export async function initialize(store: any, zcoind: Zcoind) {
    const data = await zcoind.readAddressBook();
    store.commit('AddressBook/setAddressBook', data);
}
