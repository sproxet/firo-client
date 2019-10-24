import fs from 'fs'
import path from 'path'
import * as types from '../types/App'
import { getApp, getAppSettings } from '#/lib/utils'
import { createLogger } from '#/lib/logger'
import Vue from 'vue'

const logger = createLogger('zcoin:store:app')

const state = {
    isReady: false,
    isRunning: false,
    isStopping: false,
    isRestarting: false,
    walletIsLocked: false,
    walletVersion: 0,
    showIntroScreen: undefined,
    passphrase: null,
    appVersion: null,
    blockchainLocation: '',
    zcoinLink: ''
}

const mutations = {
    [types.IS_READY] (state) {
        state.isReady = true
        state.isRestarting = false
        state.isStopping = false
    },

    [types.SET_BLOCKCHAIN_LOCATION] (state, location) {
        state.blockchainLocation = location
    },

    [types.SET_APP_VERSION] (state, version) {
        state.appVersion = version
    },

    // daemon

    [types.DAEMON_IS_RUNNING] (state) {
        state.isRunning = true
    },

    [types.DAEMON_STOPPED] (state) {
        state.isReady = false
        state.isRunning = false
        state.isStopping = false
    },

    [types.DAEMON_STOP] (state) {
        state.isReady = false
        state.isStopping = true
    },

    [types.DAEMON_RESTART] (state) {
        state.isRestarting = true
    },

    [types.DAEMON_START] (state) {
        state.isRestarting = true
    },

    // wallet lock

    [types.SET_WALLET_LOCKED] (state, isLocked) {
        Vue.set(state, 'walletIsLocked', isLocked)
    },

    [types.SET_WALLET_VERSION] (state, version) {
        state.walletVersion = version
    },

    [types.LOCK_WALLET] () {
    },

    // intro

    [types.HIDE_INTRO_SCREEN] (state) {
        state.showIntroScreen = false
    },

    [types.SET_INTRO_SCREEN] (state, value) {
        Vue.set(state, 'showIntroScreen', value)
    },

    // passphrase

    [types.SET_CURRENT_PASSPHRASE] (state, passphrase) {
        state.passphrase = passphrase
    },

    [types.CLEAR_PASSPHRASE] (state) {
        state.passphrase = null
    },

    setDaemon (state, daemon) {
        state.daemon = daemon;
    },

    // This triggers a watcher in App.vue.
    gotLink (state, url) {
        state.zcoinLink = url;
    }
}

const actions = {
    [types.IS_READY] ({ commit, state, getters }) {
        if (state.isReady) {
            return
        }


        commit(types.IS_READY)

        if (state.showIntroScreen === undefined) {
            commit(types.SET_INTRO_SCREEN, getters.showIntroScreen)
        }
    },

    [types.SET_WALLET_LOCKED] ({ commit, state }, isLocked) {
        if (state.walletIsLocked === isLocked) {
            return
        }

        commit(types.SET_WALLET_LOCKED, isLocked)
    },

    [types.SET_WALLET_VERSION] ({ commit, state }, version) {
        if (state.walletVersion === version) {
            return
        }

        commit(types.SET_WALLET_VERSION, version)
    },

    [types.LOCK_WALLET] ({ commit, state }, passphrase) {
        // already locked. returning
        if (state.walletIsLocked) {
            logger.info('wallet is already locked')
            return
        }

        commit(types.LOCK_WALLET, { passphrase })
    },

    [types.DAEMON_IS_RUNNING] ({ commit, getters }) {
        if (!getters['isRunning']) {
            commit(types.DAEMON_IS_RUNNING)
        }
    },

    [types.DAEMON_STOP] ({ commit, dispatch, state }) {
        if (state.isStopping || !state.isRunning) {
            return
        }

        commit(types.DAEMON_STOP)
        logger.info('showing waitForDaemonShutdown window')
        dispatch('Window/show', 'waitForDaemonShutdown', { root: true })
        dispatch('Window/close', 'main', { root: true })
    },

    [types.DAEMON_STOPPED] ({ commit, state }) {
        if (!state.isRunning) {
            return
        }

        commit(types.DAEMON_STOPPED)
    },

    [types.DAEMON_RESTART] ({ commit, state }) {
        if (state.isRestarting) {
            return
        }

        // set restart flag
        commit(types.DAEMON_RESTART)

        if (!state.isRunning) {
            return commit(types.DAEMON_START)
        }

        // stop daemon
        commit(types.DAEMON_STOP)
    },

    [types.DAEMON_START] ({ state, commit }) {
        if (state.isRunning) {
            return
        }

        commit(types.DAEMON_START)
    },

    [types.HIDE_INTRO_SCREEN] ({ commit, state }) {
        commit(types.HIDE_INTRO_SCREEN)
    },

    [types.SET_CURRENT_PASSPHRASE] ({ commit, state }, passphrase) {
        if (state.passphrase === passphrase) {
            return
        }

        commit(types.SET_CURRENT_PASSPHRASE, passphrase)
    },

    [types.CLEAR_PASSPHRASE] ({ commit }) {
        commit(types.CLEAR_PASSPHRASE)
    },

    // todo move to settings
    [types.SET_BLOCKCHAIN_LOCATION] ({ commit, state }, location) {
        if (!location) {
            return
        }

        if (!fs.existsSync(location)) {
            logger.warn('given location does not exist: %s', location)
            return
        }

        // todo: could potentially watch the location to catch cases where the user freakes out and...
        // todo: ...moves the folder while zcoin is running

        logger.info('setting blockchain location to %s', location)

        commit(types.SET_BLOCKCHAIN_LOCATION, location)

        // This has been modified from an unconditional set, because we don't want it to override what we did in
        // changeBlockchainLocation.
        if (!getAppSettings().get(`app.${types.SET_BLOCKCHAIN_LOCATION}`)) {
            getAppSettings().set(`app.${types.SET_BLOCKCHAIN_LOCATION}`, location)
        }
    },

    // Change the blockchain location to newLocation, creating it if it does not exist. If we fail, we will through with
    // the reason.
    async changeBlockchainLocation ({}, newLocation) {
        if (!path.isAbsolute(newLocation)) {
            throw "Location for the new blockchain must be an absolute path.";
        }

        if (!fs.existsSync(newLocation)) {
            // Throws on failure.
            fs.mkdirSync(newLocation);
        }

        try {
            fs.accessSync(newLocation, fs.constants.W_OK | fs.constants.R_OK);
        } catch {
            throw `${newLocation} is not writable by the current user.`
        }

        getAppSettings().set(`app.${types.SET_BLOCKCHAIN_LOCATION}`, newLocation);
    },

    [types.SET_APP_VERSION] ({ commit }, version) {
        if (state.appVersion === version) {
            return
        }

        commit(types.SET_APP_VERSION, version)
    },

    [types.PERSIST_APP_VERSION] ({ dispatch, getters }) {
        const version = getters.runningAppVersion

        if (getters.appVersion === version) {
            return
        }

        dispatch(types.SET_APP_VERSION, version)
        getAppSettings().set(`app.${types.SET_APP_VERSION}`, version)
    },

    gotLink ({commit}, url) {
        commit('gotLink', url);
    }
}

const getters = {
    isReady: (state) => state.isReady || false,
    isStopping: (state) => state.isStopping || false,
    isRunning: (state) => state.isRunning || false,
    isRestarting: (state) => state.isRestarting || false,
    appVersion: (state) => state.appVersion,
    runningAppVersion: () => getApp().getVersion(),
    appVersionChanged: (state, getters) => getters.appVersion !== getters.runningAppVersion,
    isInitialRun: (state) => {
        return !state.appVersion
    },

    blockchainLocation: (state) => {

        return state.blockchainLocation
    },
    hasBlockchainLocation: (state, getters) => !!getters.blockchainLocation,

    showIntroScreen: (state, getters, rootState, rootGetters) => {
        if (state.showIntroScreen !== undefined) {
            return state.showIntroScreen
        }

        // check for all intro screen submodules
        // 1. is initial run
        if (getters.isInitialRun) {
            return true
        }

        // 2. version changed
        if (getters.appVersionChanged) {
            return true
        }

        // 3. has location
        if (!getters.hasBlockchainLocation) {
            return true
        }

        // 4. is locked
        if (!getters.isLocked) {
            return true
        }

        return false
    },
    isLocked: (state) => state.walletIsLocked,
    walletVersion: (state) => state.walletVersion,
    showIncomingPaymentRequest (state, getters, rootState, rootGetters) {
        return rootGetters['Clipboard/hasIncomingPaymentRequest'] &&
            !rootGetters['Clipboard/isNotified']
    },
    hasOpenOverlay (state, getters, rootState, rootGetters) {
        const windowHasOpenModal = rootGetters['Window/hasOpenModal']
        const networkIsConnected = rootGetters['Network/isConnected']
        const networkConnectionError = rootGetters['Network/ConnectionError']

        return windowHasOpenModal ||
            !networkIsConnected ||
            getters.showIntroScreen ||
            networkConnectionError ||
            getters.showIncomingPaymentRequest
    },
    currentPassphrase: (state) => state.passphrase,

    zcoinLink: (state) => state.zcoinLink
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
