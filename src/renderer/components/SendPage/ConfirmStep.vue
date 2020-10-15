<template>
    <div>
        <div class="title">
            Confirm Send
        </div>

        <div class="content">
            Hello, world!
        </div>

        <div class="buttons">
            <button @click="$emit('cancel')">
                Cancel!
            </button>
        </div>
    </div>
</template>

<script>
// $emits: cancel, confirm
import { convertToCoin } from 'lib/convert'

export default {
    name: 'SendStepConfirm',

    props: {
        label: {
            required: true,
            type: String
        },

        address: {
            required: true,
            type: String
        },

        amount: {
            required: true,
            type: Number
        },

        fee: {
            required: true,
            type: Number
        }
    },

    methods: {
        convertToCoin
    }
}
</script>

<style scoped lang="scss">
@import "src/renderer/styles/inputs";
@import "src/renderer/styles/popup";

@include popup();

.buttons {
    @include buttons-container();
}
</style>
