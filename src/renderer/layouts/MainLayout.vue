<template>
    <div class="main-layout">
        <Sidebar />

        <main ref="main" class="main">
            <router-view />
        </main>
    </div>
</template>

<script>
import Sidebar from 'renderer/components/Sidebar'

export default {
    name: 'MainLayout',

    components: {
        Sidebar,
    }
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
