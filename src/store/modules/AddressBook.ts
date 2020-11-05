import {fromPairs} from "lodash";
import {AddressBookItem} from "../../daemon/zcoind"
import Vue from "vue";

const state = {
    addressBook: <{[address: string]: AddressBookItem}>{}
};

const mutations = {
    setAddressBook(state, addressBook: AddressBookItem[]) {
        state.addressBook = fromPairs(addressBook.map(x => [x.address, x]));
    },

    // This must be called *in addition to* $daemon.editAddressBook.
    updateAddress(state, addressBookItem: AddressBookItem) {
        Vue.set(state.addressBook, addressBookItem.address, addressBookItem);
    },

    deleteAddress(state, addressBookItem: AddressBookItem) {
        delete state.addressBook[addressBookItem.address];
    }
};

const getters = {
    addressBook: (state) => state.addressBook,

    sendAddresses: (state) =>
        (<AddressBookItem[]>Object.values(state.addressBook))
            .filter(a => a.purpose === 'send')
            .sort((a, b) =>
                (a.label || '\xff' ).localeCompare(b.label || '\xff') || a.address.localeCompare(b.address)
            ),

    receiveAddresses: (state) =>
        (<AddressBookItem[]>Object.values(state.addressBook))
            .filter(a => a.purpose === 'receive')
            .sort((a, b) =>
                (a.label || '\xff' ).localeCompare(b.label || '\xff') || a.address.localeCompare(b.address)
            )
};

export default {
    namespaced: true,
    state,
    mutations,
    getters
}