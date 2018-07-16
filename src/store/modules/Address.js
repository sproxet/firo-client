import Vue from 'vue'
import * as types from '../types/Address'
import rootTypes from '../types'

const WALLET_ADDRESS_KEY = 'walletAddresses'
const THIRD_PARTY_ADDRESS_KEY = 'thirdPartyAddresses'

const state = {
    [WALLET_ADDRESS_KEY]: {},
    [THIRD_PARTY_ADDRESS_KEY]: {}
}

const mutations = {
    [types.ADD_WALLET_ADDRESS] (state, { address, total }) {
        console.log('adding wallet address', address, total)

        Vue.set(state[WALLET_ADDRESS_KEY], address, {
            address,
            total,
            transactions: []
        })
    },

    [types.ADD_THIRD_PARTY_ADDRESS] (state, { address, total }) {
        console.log('adding third party address', address, total)
        Vue.set(state[THIRD_PARTY_ADDRESS_KEY], address, {
            address,
            total,
            transactions: []
        })
    },

    [types.ADD_TRANSACTION] (state, { stack, address, transaction }) {
        state[stack][address].transactions = [
            ...state[stack][address].transactions,
            transaction
        ]
    }
}

const actions = {
    [types.SET_INITIAL_STATE] ({ commit, dispatch, state }, initialState) {
        console.log(Object.keys(initialState))

        for (const addressKey of Object.keys(initialState)) {
            const address = initialState[addressKey]

            if (!address) {
                continue
            }

            const { txids, total } = address

            if (!txids) {
                console.log('no txids found for address', addressKey)
                break
            }

            console.log('total:', total)

            for (let txid of Object.keys(txids)) {
                const { category: txCategories } = txids[txid]

                console.log('txCategories', txCategories)

                for (let txCategory of Object.keys(txCategories)) {
                    console.log('txCategory', txCategory)

                    const tx = txCategories[txCategory]
                    const { category } = tx

                    console.log('category', category)

                    if (!category) {
                        console.log(tx, address)
                        return
                    }

                    switch (category.toLowerCase()) {
                    case 'receive':
                        dispatch(types.ADD_WALLET_ADDRESS, {
                            address: addressKey,
                            total
                        })
                        dispatch(types.ADD_RECEIVE_FROM_TX, tx)
                        break

                    case 'send':
                        dispatch(types.ADD_THIRD_PARTY_ADDRESS, {
                            address: addressKey,
                            total
                        })
                        dispatch(types.ADD_SEND_FROM_TX, tx)
                        // console.log('got send tx', addressKey, tx)
                        break
                    case 'mint':
                        dispatch(types.ADD_MINT_FROM_TX, tx)
                        break
                    /*
                    case 'spend':
                        console.log('spend tx', tx)
                        // dispatch(types.ADD_SPEND_FROM_TX, tx)
                        break
                    */
                    default:
                        console.warn('UNHANDLED ADDRESS CATEGORY', category, tx)
                        break
                    }
                }
            }
        }
    },

    [types.ADD_WALLET_ADDRESS] ({ commit, state }, { address, total }) {
        if (state.walletAddresses[address] !== undefined) {
            return
        }

        commit(types.ADD_WALLET_ADDRESS, { address, total })
    },

    [types.ADD_THIRD_PARTY_ADDRESS] ({ commit, state }, { address, total }) {
        if (state.thirdPartyAddresses[address] !== undefined) {
            return
        }

        commit(types.ADD_THIRD_PARTY_ADDRESS, { address, total })
    },

    [types.ADD_RECEIVE_FROM_TX] ({ commit, dispatch, state }, receiveTx) {
        const { address, amount, blockheight, blockhash, blocktime, category, confirmations, timereceived, txid } = receiveTx
        // dispatch(types.ADD_ADDRESS, { address })

        commit(types.ADD_TRANSACTION, {
            stack: WALLET_ADDRESS_KEY,
            address,
            transaction: {
                amount,
                category,
                confirmations,
                timereceived,
                block: {
                    height: blockheight,
                    hash: blockhash,
                    time: blocktime
                },
                id: txid
            }
        })
    },

    [types.ADD_SEND_FROM_TX] ({ commit }, sendTx) {
        const { address, amount, blockheight, blockhash, blocktime, category, confirmations, fee, timereceived, txid } = sendTx

        commit(types.ADD_TRANSACTION, {
            stack: THIRD_PARTY_ADDRESS_KEY,
            address,
            transaction: {
                amount,
                category,
                confirmations,
                fee,
                timereceived,
                block: {
                    height: blockheight,
                    hash: blockhash,
                    time: blocktime
                },
                id: txid
            }
        })
    },

    [types.ADD_MINT_FROM_TX] ({ commit, dispatch, state }, mintTx) {
        console.log('ADD_MINT_FROM_TX', mintTx)

        const { amount, blockhash, blocktime, confirmations, fee, timereceived, txid, used } = mintTx

        dispatch(rootTypes.mint.UPDATE_MINT, {
            amount,
            confirmations,
            fee,
            timereceived,
            used,
            block: {
                hash: blockhash,
                time: blocktime
            },
            id: txid
        }, { root: true })
    },

    [types.ON_ADDRESS_SUBSCRIPTION] ({ dispatch, state }, data) {
        console.log('ON_ADDRESS_SUBSCRIPTION')
        try {
            dispatch(types.SET_INITIAL_STATE, data)
        } catch (e) {
            console.log('ON_ADDRESS_SUBSCRIPTION ERROR\n---------------')
            console.log(e)
            console.log(data)
            console.log('---------------')
        }
    }
}

const getters = {
    walletAddresses (state, getters, rootState, rootGetters) {
        return Object.values(state[WALLET_ADDRESS_KEY]).map((addr) => {
            const { transactions } = addr
            const currentBlockHeight = rootGetters['Blockchain/currentBlockHeight']
            const confirmations = currentBlockHeight ? currentBlockHeight - addr.block.height : addr.confirmations

            return {
                ...addr,
                hasTransactions: !!transactions.length,
                isReused: transactions.length > 1,
                confirmations,
                isConfimed: confirmations >= 6
            }
        })
    },
    thirdPartyAddresses: (state) => Object.values(state[THIRD_PARTY_ADDRESS_KEY])
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}