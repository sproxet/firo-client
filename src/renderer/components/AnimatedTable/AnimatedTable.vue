<template>
    <div class="animated-table">
        <vuetable
            ref="vuetable"
            :class="theme"
            :api-mode="false"
            :fields="getFieldsWithLocalizedTitle"
            :per-page="perPage"
            :track-by="trackBy"
            :data-manager="dataManager"
            pagination-path="pagination"
            :row-transition-name="rowTransition"
            :row-class="getRowClass"
            :no-data-template="noDataMessage"
            v-bind="{ scopedSlots: $scopedSlots }"
            @vuetable:pagination-data="onPaginationData"
            @vuetable:row-clicked="onRowClick"
        />

        <div>
            <animated-table-pagination
                ref="pagination"
                :theme="theme"
                @vuetable-pagination:change-page="onChangePage"
            />
        </div>
    </div>
</template>

<script>
import { Vuetable } from 'vuetable-2'
import AnimatedTablePagination from './AnimatedTablePagination'
import _ from 'lodash'

export default {
    name: 'AnimatedTable',
    components: {
        Vuetable,
        AnimatedTablePagination
    },
    props: {
        fields: {
            type: Array,
            required: true
        },
        data: {
            type: Array,
            required: true
        },
        trackBy: {
            type: String,
            default: 'id'
        },
        sortOrder: {
            type: Array,
            default: () => [
                {
                    field: 'createdAt',
                    direction: 'desc'
                }
            ]
        },
        perPage: {
            type: Number,
            default: 10
        },
        noDataMessage: {
            type: String,
            default: ''
        },
        selectedRow: {
            type: String,
            default: null
        },
        onRowSelect: {
            type: Function,
            default: null
        },
        onPageChange: {
            type: Function,
            default: (newPage) => null
        },
        theme: {
            type: String,
            default: ''
        },
        // This is used to check if data has changed and we need to refresh the table. Yes, it's really needed, despite
        // the reactive nature of Vue, as oftentimes data gets recalculated without actually changing the result, and we
        // don't want the user to get sent back to page 1 unless the table itself actually changes, even if some of the
        // things that went into calculating it did.
        compareElements: {
            type: Function,
            default: (a, b) => a === b
        }
    },

    data () {
        return {
            interval: null,
            rowTransition: 'fade'
        }
    },

    computed: {
        getFieldsWithLocalizedTitle () {
            return this.fields.map((field) => {
                return {
                    ...field,
                    title: this.$t(field.title)
                }
            })
        }
    },

    watch: {
        data (newVal, oldVal) {
            let isEqual = true

            if (newVal.length === oldVal.length) {
                for (const i in newVal) {
                    if (!this.compareElements(newVal[i], oldVal[i])) {
                        isEqual = false
                        break
                    }
                }
            } else {
                isEqual = false
            }

            if (!isEqual) {
                this.$refs.vuetable.refresh()
                this.onPageChange(1);
            }
        }
    },

    methods: {
        getRowClass (item, index) {
            const classes = []

            if (item[this.trackBy] === this.selectedRow) {
                classes.push('selected')
            }

            if (item.isFulfilled) {
                classes.push('is-fulfilled')
            }
            if (item.isIncoming) {
                classes.push('is-incoming')
            }
            if (item.isReused) {
                classes.push('is-reused')
            }

            return classes.join(' ')
        },

        onRowClick (rowData) {
            const { data, index, event } = rowData

            if (this.onRowSelect) {
                this.onRowSelect(data, index, event)
            }
        },

        onPaginationData (paginationData) {
            this.$refs.pagination.setPaginationData(paginationData)
        },

        onChangePage (page) {
            this.rowTransition = ''
            this.$refs.vuetable.changePage(page)
            this.rowTransition = 'fade'
            this.onPageChange(page);
        },

        dataManager (sortOrder, pagination) {
            if (this.data.length < 1) {
                return {
                    data: []
                }
            }

            let local = this.data

            // see if we got a sort order passed in into the call if not,
            // fall back to the optional prop
            const orderBy = sortOrder.length ? sortOrder : this.sortOrder

            // sortOrder can still be empty, so we have to check for that as well
            if (orderBy.length > 0) {
                local = _.orderBy(
                    local,
                    orderBy[0].sortField,
                    orderBy[0].direction
                )
            }

            pagination = this.$refs.vuetable.makePagination(
                local.length,
                this.perPage
            )
            let from = pagination.from - 1
            let to = from + this.perPage

            return {
                pagination: pagination,
                data: _.slice(local, from, to)
            }
        }
    }
}
</script>

<style lang="scss">
@import "src/renderer/styles/colors";
@import "src/renderer/styles/sizes";

.animated-table {
    .vuetable-body-wrapper {
        & > table {
            width: 100%;
            border-collapse: collapse;
        }
    }

    thead {
        text-align: left;

        th {
            color: $color-table-heading;
            padding-bottom: 1em;
        }
    }

    .vuetable-body {
        tr {
            cursor: pointer;

            // alternating colours for different rows
            &:nth-child(odd) {
                background: darken($color-table-background, 10%);
            }
            &:nth-child(even) {
                background: $color-table-background;
            }

            // highlight on hover
            &:hover {
                &:nth-child(odd) {
                    td {
                        background: lighten($color-table-background, 20%);
                    }
                }

                td {
                    background: $color-table-background;
                }
            }

            td {
                border-top: {
                    color: $color-table-border;
                    style: solid;
                    width: 1px;
                }

                padding: {
                    top: $size-tiny-space;
                    bottom: $size-tiny-space;
                }
            }
        }
    }
}
</style>
