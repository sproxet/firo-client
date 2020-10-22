<template>
    <th v-if="isHeader">
        Label
    </th>

    <td v-else class="label">
        {{ rowData.label || 'Untitled' }}
    </td>
</template>

<script>
import VuetableFieldMixin from 'vuetable-2/src/components/VuetableFieldMixin.vue';

export default {
    name: "PaymentRequestLabel",

    mixins: [
        VuetableFieldMixin
    ]
}
</script>

<style scoped lang="scss">
@import "src/renderer/styles/typography";

td {
    @include label();
}
</style>
