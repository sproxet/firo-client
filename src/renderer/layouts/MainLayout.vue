<template>
    <div class="main-layout">
        <PaymentPendingWarning v-if="showPaymentPendingWarning" class="warning" />

        <div class="content">
            <Sidebar />

            <main ref="main" class="main">
                <router-view />
            </main>
        </div>
    </div>
</template>

<script>
import {mapGetters} from "vuex";
import Sidebar from 'renderer/components/Sidebar'
import PaymentPendingWarning from "renderer/components/PaymentPendingWarning";

export default {
    name: 'MainLayout',

    components: {
        Sidebar,
        PaymentPendingWarning
    },

    computed: mapGetters({
        showPaymentPendingWarning: 'App/showPaymentPendingWarning'
    })
}
</script>

<style lang="scss">
@import "src/renderer/styles/colors";
@import "src/renderer/styles/sizes";

.main-layout {
    height: 100vh;
    display: flex;
    flex-flow: column;

    .content {
        flex-grow: 1;

        .sidebar {
            float: left;
            width: $size-sidebar-width;
            height: 100%;
            background: $color-menu-background;
        }

        .main {
            float: right;
            width: calc(100vw - #{$size-sidebar-width});
            height: 100%;
            background: $color-main-background;
        }
    }
}
</style>
