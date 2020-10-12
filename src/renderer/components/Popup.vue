<template>
    <div id="popup">
        <div id="inner-popup">
            <slot />
        </div>
    </div>
</template>

<script>
export default {
    name: "Popup"
}
</script>

<style scoped lang="scss">
@import "src/renderer/styles/z";
@import "src/renderer/styles/colors";
@import "src/renderer/styles/sizes";

#popup {
    z-index: $z-popup;
    position: absolute;
    left: 0;
    top: 0;
    height: 100vh;
    width: 100vw;
    // Make #popup transparent. It will still steal clicks of all external elements.
    background-color: $color-popup-outside;

    display: flex;
    align-items: center;
    justify-content: center;

    #inner-popup {
        background-color: $color-popup-background;
        width: fit-content;
        height: fit-content;
        padding: $size-popup-margin;
        box-shadow: 0 8px 8px rgba(0, 0, 0, 0.25);
        border-radius: 8px;
    }
}
</style>