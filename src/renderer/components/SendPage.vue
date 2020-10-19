<template>
    <div id="send-page">
        <div id="send-primary">
            <PaymentsPage />
        </div>

        <SendDetail />
    </div>
</template>

<script>
import {mapGetters} from "vuex";
import PaymentsPage from "renderer/components/PaymentsPage";
import SendDetail from "renderer/components/SendPage/SendDetail";

export default {
    name: 'MainLayout',

    components: {
        SendDetail,
        PaymentsPage
    }
}
</script>

<style lang="scss">
@import "src/renderer/styles/colors";
@import "src/renderer/styles/sizes";

#send-page {
    height: 100%;

    #send-primary {
        height: 100%;
        width: $size-primary-content-width;
        float: left;
    }
}
</style>
