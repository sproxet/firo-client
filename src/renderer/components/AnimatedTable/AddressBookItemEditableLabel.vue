<template>
    <th v-if="isHeader">
        Label
    </th>

    <td v-else class="label">
        <div v-if="isEditing">
            <input v-model="label" @keyup.enter="onLabelInput" @blur="onLabelInput" />
        </div>

        <div v-else>
            <a href="#" @click="isEditing=true">
                {{ label || 'Unlabelled' }}
            </a>
        </div>
    </td>
</template>

<script>
import VuetableFieldMixin from 'vuetable-2/src/components/VuetableFieldMixin.vue';

export default {
    name: "PaymentRequestLabel",

    mixins: [
        VuetableFieldMixin
    ],

    data() {
        return {
            lastLabel: this.rowData.label,
            label: this.rowData.label,
            isEditing: false
        };
    },

    methods: {
        onLabelInput() {
            this.isEditing = false;
            if (this.lastLabel === this.label) return;
            alert(`${[this.rowData.label, this.label]}`);
            this.lastLabel = this.label;
        }
    }
}
</script>

<style scoped lang="scss">
@import "src/renderer/styles/typography";

td {
    @include label();
}
</style>
