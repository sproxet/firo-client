<template>
    <section class="balance">
        <div id="available-xzc">
            <amount :amount="availableXzc" />&nbsp;<span class="ticker">XZC</span>
        </div>
        <div v-if="lockedXzc > 0" id="locked-xzc">
            +&nbsp;<amount :amount="lockedXzc" />&nbsp;<span class="ticker">XZC</span>&nbsp;locked
        </div>
        <div v-if="pendingXzc > 0" id="pending-xzc">
            +&nbsp;<amount :amount="pendingXzc" />&nbsp;<span class="ticker">XZC</span>&nbsp;pending
        </div>

        <div id="available-private-xzc">
            <amount :amount="availableZerocoin" />&nbsp;<span class="ticker" title="Private XZC">ⓩ</span>
        </div>
        <div v-if="unconfirmedZerocoin > 0" id="pending-private-xzc">
            +&nbsp;<amount :amount="unconfirmedZerocoin" />&nbsp;<span class="ticker" title="Private XZC">ⓩ</span>&nbsp;pending
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
            availableXzc: 'Balance/availableXzc',
            unconfirmedXzc: 'Balance/unconfirmedXzc',
            immatureXzc: 'Balance/immatureXzc',
            lockedXzc: 'Balance/lockedXzc',
            availableZerocoin: 'Balance/availableZerocoin',
            unconfirmedZerocoin: 'Balance/unconfirmedZerocoin'
        }),

        pendingXzc () {
            return this.immatureXzc + this.unconfirmedXzc
        }
    }
}
</script>

<style lang="scss" scoped>
.balance {
    opacity: 0.8;
    text-align: right;
    margin: {
        top: 1em;
        right: 1em;
        left: 1em;
    }

    .ticker {
        color: #23B852;
    }
}
</style>
