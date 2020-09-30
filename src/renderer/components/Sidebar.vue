<template>
    <div class="sidebar">
        <div class="logo">
            <router-link to="/main">
                <zcoin-logo-text />
            </router-link>
        </div>

        <div v-if="network === 'test'" class="network-badge">
            Testnet
        </div>
        <div v-else-if="network === 'regtest'" class="network-badge">
            Regtest
        </div>
        <div v-else-if="network !== 'main'" class="network-badge">
            Unknown Network
        </div>

        <balance />
        <main-menu />
        <blockchain />
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ZcoinLogoText from "./Icons/ZcoinLogoText";
import Balance from 'renderer/components/Sidebar/Balance'
import MainMenu from 'renderer/components/Sidebar/MainMenu'
import Blockchain from 'renderer/components/Sidebar/Blockchain'

export default {
    name: 'Sidebar',

    components: {
        ZcoinLogoText,
        Balance,
        MainMenu,
        Blockchain
    },

    computed: mapGetters({
        network: 'ApiStatus/network'
    })
}
</script>

<style lang="scss" scoped>
@import '../styles/colors';

.sidebar {
    background-image: linear-gradient(to top right, $color--dark, $color--comet-dark-mixed);
    color: #fff;
    height: 100vh;

    .logo, .network-badge {
        width: fit-content;
        margin: {
            left: auto;
            right: auto;
        }
    }

    .logo {
        margin-top: 4em;

        svg {
            height: 3em;
        }
    }

    .network-badge {
        color: red;
    }

    .main-menu {
        margin-top: 1em;
    }

    .blockchain {
        position: absolute;
        bottom: 0;
        width: max-content;
    }
}
</style>
