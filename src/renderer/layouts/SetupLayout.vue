<template>
    <div class="setup-layout">
        <div class="logo">
            <img src="/assets/FiroLogoDark.svg" />
        </div>

        <router-view class="setup-child" />
    </div>
</template>

<script>
export default {
    name: "SetupLayout"
}
</script>

<style scoped lang="scss">
@import "src/renderer/styles/colors";
@import "src/renderer/styles/sizes";


.setup-layout {
    position: fixed;
    background-color: $color-setup-background;
    height: 100vh;
    width: 100vw;

    .logo {
        width: fit-content;
        margin: {
            left: auto;
            right: auto;
            top: $size-large-space;
        };

        img {
            height: $size-setup-logo-height;
        }
    }

    .setup-child {
        background-color: $color-setup-foreground;
        padding: $size-small-space;
        border-radius: $size-small-space;
        max-width: 90%;
        width: fit-content;
        margin: {
            top: $size-large-space;
            left: auto;
            right: auto;
        };
    }
}
</style>
