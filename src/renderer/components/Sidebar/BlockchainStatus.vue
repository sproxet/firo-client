<template>
    <div id="blockchain-status">
        <div v-if="connections === 0 && network !== 'regtest'">
            <loading-bounce size="mini" />
            Connecting...
        </div>
        <div v-else-if="!isBlockchainSynced">
            <loading-bounce size="mini" />
            Syncing...
            <span class="progress">
                ({{currentBlockHeight}}/~{{estimatedBlockHeight}})
            </span>
        </div>
    </div>
</template>

<script>
import {mapGetters} from "vuex";
import LoadingBounce from "../Icons/LoadingBounce";

export default {
    name: "BlockchainStatus",

    components: {
        LoadingBounce
    },

    computed: {
        ...mapGetters({
            network: 'ApiStatus/network',
            connections: 'Blockchain/connections',
            currentBlockHeight: 'Blockchain/currentBlockHeight',
            estimatedBlockHeight: 'Blockchain/estimatedBlockHeight',
            isBlockchainSynced: 'Blockchain/isBlockchainSynced',
        })
    }
}
</script>

<style scoped lang="scss">
@import "src/renderer/styles/sizes";

#blockchain-status {
    font-style: italic;
    margin: {
        bottom: $size-tiny-space;
        left: $size-tiny-space;
    }

    // This is the loading bounce.
    .spinner {
        margin-right: $size-tiny-space;
    }

    * {
        display: inline-block;
    }
}
</style>