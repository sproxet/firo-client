<template>
    <div id="app">
        <div :v-show="!!waitingReason">
            <WaitingScreen v-if="waitingReason" :reason="waitingReason" />
        </div>

        <div :v-show="waitingReason">
            <keep-alive>
                <router-view />
            </keep-alive>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import WaitingScreen from "renderer/components/WaitingScreen";

export default {
    name: 'ZcoinClient',

    components: {
        WaitingScreen
    },

    computed: mapGetters({
        waitingReason: 'App/waitingReason'
    })
}
</script>

<style lang="scss">
@import './styles';

#app {
    max-height: 100vh;
    overflow: hidden;
}
</style>
