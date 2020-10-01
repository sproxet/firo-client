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

.main-layout {
    .sidebar {
        float: left;
        width: fit-content;
        background: $color-menu-background;
    }

    .main {
        width: available;
        height: 100vh;
        background: $color-main-background;
    }
}
</style>
