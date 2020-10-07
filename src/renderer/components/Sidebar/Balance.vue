<template>
    <section class="balance">
        <div id="available">
            <amount :amount="available" />&nbsp;<span class="ticker">XFR</span>
        </div>
        <div v-if="locked > 0" id="locked">
            +&nbsp;<amount :amount="locked" />&nbsp;locked
        </div>
        <div v-if="pendingAndPublic > 0" id="pending">
            +&nbsp;<amount :amount="pendingAndPublic" />&nbsp;pending
        </div>
    </section>
</template>

<script>
import { mapGetters } from 'vuex' /* , mapActions */
import Amount from './Amount'

export default {
    name: 'Balance',

    components: {
        Amount
    },

    computed: {
        ...mapGetters({
            available: 'Balance/available',
            locked: 'Balance/locked',
            pendingAndPublic: 'Balance/pendingAndPublic'
        })
    }
}
</script>

<style lang="scss" scoped>
@import "src/renderer/styles/colors";

.balance {
    opacity: 0.8;
    text-align: right;
    margin: {
        top: 1em;
        right: 1em;
        left: 1em;
    }

    .ticker {
        color: $color-text-accent;
    }
}
</style>
