<template>
    <div class="waiting-screen">
        <div class="inner">
            <h2 class="header-text">
                Just a Moment...
            </h2>

            <img class="logo" src="/assets/FiroSymbolWhite.svg" />

            <div class="reason">
                {{ reason }}
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "WaitingScreen",

    props: {
        reason: {
            type: String,
            required: true
        }
    }
}
</script>

<style scoped lang="scss">
@import "src/renderer/styles/colors";
@import "src/renderer/styles/sizes";
@import "src/renderer/styles/z";

.waiting-screen {
    position: fixed;
    height: 100vh;
    width: 100vw;
    z-index: $z-waiting-screen;
    text-align: center;
    background-color: $color-loading-background;

    .inner {
        // Center .inner horizontally and vertically.
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);

        .logo {
            width: 20vw;
            margin: {
                top: $size-medium-space;
                bottom: $size-medium-space;
                left: auto;
                right: auto;
            }
        }

        .reason {
            color: $color-text-accent;
            font-style: italic;
        }
    }
}
</style>
