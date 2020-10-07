<template>
    <div class="main-layout">
        <Sidebar />

        <main ref="main" class="main">
            <keep-alive exclude="AnonymizePage">
                <router-view />
            </keep-alive>
        </main>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Sidebar from 'renderer/components/Sidebar'

export default {
    name: 'MainLayout',

    components: {
        Sidebar,
    },

    computed: mapGetters({
        waitingReason: 'App/waitingReason'
    })
}
</script>

<style lang="scss">
@import "src/renderer/styles/colors";
@import "src/renderer/styles/sizes";


.main-layout {
    .sidebar {
        float: left;
        width: $size-sidebar-width;
        height: 100vh;
        background: $color-menu-background;
    }

    .main {
        float: right;
        width: calc(100vw - #{$size-sidebar-width});
        height: 100vh;
        background: $color-main-background;
    }
}
</style>
