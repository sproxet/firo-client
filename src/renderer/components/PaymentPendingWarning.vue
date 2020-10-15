<template>
    <div id="payment-pending-warning">
        <h3>
            {{ convertToCoin(availablePublic) }} XFR pending. <a href="#" @click="anonymizeFunds">Click here</a> to secure them.
        </h3>
    </div>
</template>

<script>
import {mapGetters} from "vuex";
import {convertToCoin} from "lib/convert";

export default {
    name: "PaymentPendingWarning",

    computed: mapGetters({
        availablePublic: 'Balance/availablePublic'
    }),

    methods: {
        convertToCoin,

        anonymizeFunds() {
            throw 'unimplemented';
        }
    }
}
</script>

<style scoped lang="scss">
@import "src/renderer/styles/colors";
@import "src/renderer/styles/sizes";

#payment-pending-warning {
    user-select: none;
    height: 100%;
    background: $color-warning-background;
    color: $color-warning-text;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
}
</style>