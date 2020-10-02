<template>
    <div class="sidebar">
        <div class="logo">
            <router-link to="/main">
                <img src="/assets/FiroLogoDark.svg" />
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
import FiroLogo from 'renderer/assets/FiroLogoDark.svg';
import Balance from 'renderer/components/Sidebar/Balance'
import MainMenu from 'renderer/components/Sidebar/MainMenu'
import Blockchain from 'renderer/components/Sidebar/Blockchain'

export default {
    name: 'Sidebar',

    components: {
        FiroLogo,
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
@import 'src/renderer/styles/colors';
@import 'src/renderer/styles/sizes';

.sidebar {
    background-color: $color-menu-background;
    color: $color-text-light;
    height: 100vh;
    width: $size-sidebar-width;

    .logo, .network-badge {
        width: fit-content;
        margin: {
            left: auto;
            right: auto;
        }
    }

    .logo {
        margin-top: $size-menu-top-margin;

        img {
            height: $size-menu-logo;
        }
    }

    .network-badge {
        color: $firo-silver;
        font-size: 0.8em;
        @include monospace();
    }

    .main-menu {
        margin-top: 1em;
    }

    .blockchain {
        position: absolute;
        bottom: 0;
    }
}
</style>
