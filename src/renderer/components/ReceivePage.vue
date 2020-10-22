<template>
    <div class="receive-page">
        <div class="top">
            <div class="outer">
                <div ref="qrContainer" class="qr-container">
                    <div ref="qrContainerInner" class="inner" style="display: none">
                        <div ref="qrCode" class="qr-code" />
                    </div>
                </div>
            </div>

            <div class="address">
                <div v-if="address" class="loading">
                    <div class="label">
                        <input v-if="isEditing" class="label-input" type="text" v-model="label" />
                        <div v-else class="label-text">{{ label }}</div>

                        <input v-if="isEditing" type="button" value="Ok!" @click="changeLabel()" />
                        <input v-else type="button" value="Edit" @click="isEditing = true" />
                    </div>

                    <div class="address">
                        {{ address }}
                    </div>
                </div>
            </div>
        </div>

        <div class="bottom">
            <AnimatedTable
                :fields="tableFields"
                :data="paymentRequestsSorted"
                :compare-elements="() => false"
                no-data-message="No Saved Addresses"
            />
        </div>
    </div>
</template>

<script>
import {clipboard} from "electron";
import QRCode from "easyqrcodejs";
import {mapGetters} from "vuex";
import AnimatedTable from "renderer/components/AnimatedTable/AnimatedTable";
import PaymentRequestLabel from "renderer/components/AnimatedTable/PaymentRequestLabel";
import PaymentRequestAddress from "renderer/components/AnimatedTable/PaymentRequestAddress";

export default {
    name: "ReceivePage",

    components: {
        AnimatedTable
    },

    data() {
        let timeoutHandle = null;

        return {
            address: null,
            label: '',
            isEditing: false,
            qrCode: null,

            // This has to be here rather than as a method so we can capture this.
            resizeListener: () => this.resizeQrCode(),

            tableFields: [
                {name: PaymentRequestLabel},
                {name: PaymentRequestAddress}
            ]
        };
    },

    computed: {
        ...mapGetters({
            paymentRequests: 'PaymentRequest/paymentRequests',
            addresses: 'Transactions/addresses'
        }),

        paymentRequestsSorted() {
            return Object.values(this.paymentRequests).sort((a, b) => b.createdAt - a.createdAt);
        }
    },

    async created() {
        // Make sure everything shows properly on reload.
        while (!window.$daemon) {
            await new Promise(r => setTimeout(r, 10));
        }

        await this.displayAddress();

        window.addEventListener('resize', this.resizeListener);
    },

    destroyed() {
        window.removeEventListener('resize', this.resizeListener);
    },

    // Make sure we always display a fresh address.
    watch: {
        paymentRequests() {
            if (this.paymentRequests[this.address]) {
                this.displayAddress();
            }
        },

        addresses() {
            if (this.addresses[this.address]) {
                this.displayAddress();
            }
        }
    },

    methods: {
        async displayAddress() {
            if (this.$route.params.address) {
                this.address = this.$route.params.address;
            } else {
                this.address = await $daemon.getUnusedAddress();
            }

            if (this.paymentRequests[this.address]) {
                this.label = this.paymentRequests[this.address].label;
            } else {
                this.label = 'Unlabelled';
            }

            if (this.qrCode) {
                this.qrCode.makeCode(this.address)
            } else {
                this.qrCode = new QRCode(this.$refs.qrCode, {
                    text: this.address,
                    height: 2048,
                    width: 2048,
                    colorDark: 'black',
                    colorLight: 'white',
                    logo: '/assets/FiroSymbol.svg',
                    logoBackgroundColor: 'white',
                    onRenderingEnd: () => this.resizeQrCode()
                });
            }
        },

        resizeQrCode() {
            this.$refs.qrContainerInner.style.display = 'none';

            const size = `${this.$refs.qrContainer.clientHeight}px`;
            const img = this.$refs.qrCode.querySelector('img');
            img.style.height = size;
            img.style.width = size;
            img.style.display = 'initial';

            this.$refs.qrContainerInner.style.display = 'initial';
        },

        copyAddress() {
            clipboard.writeText(this.address);
        },

        async changeLabel() {
            if (!this.address) return;
            this.isEditing = false;

            const pr = await $daemon.createPaymentRequest(undefined, this.label, '', this.address);
            await this.$store.dispatch('PaymentRequest/addOrUpdatePaymentRequestFromResponse', pr);
            await this.$router.push(`/receive/${this.address}`);
         }
    }
}
</script>

<style scoped lang="scss">
@import "src/renderer/styles/sizes";
@import "src/renderer/styles/inputs";
@import "src/renderer/styles/typography";


$top-height: 40%;

.receive-page {
    height: 100%;
    margin: $size-main-margin;

    .top {
        height: calc(#{$top-height} - #{$size-main-margin});
        display: flex;
        flex-direction: column;
        justify-content: end;

        .outer {
            flex-grow: 1;
            padding: $size-tiny-space;

            box-shadow: $size-shadow-radius $size-shadow-radius $size-shadow-radius $size-shadow-radius $color-shadow;

            border: {
                width: 0;
                radius: $size-shadow-radius;
            }

            width: fit-content;
            margin: {
                left: auto;
                right: auto;
            }

            .qr-container {
                height: 100%;
            }
        }

        .address {
            flex-grow: 0;

            .label {
                font-weight: bold;
                width: fit-content;
                margin: {
                    left: auto;
                    right: auto;
                    top: $size-tiny-space;
                }

                * {
                    display: inline;
                }

                .label-text {
                    margin-bottom: $size-very-tiny-space;
                }

                .label-input {
                    @include wide-rounded-input();
                    margin-bottom: $size-tiny-space;
                }

                input[type="button"] {
                    @include undecorated-button();
                }
            }

            .address {
                width: fit-content;
                margin: {
                    left: auto;
                    right: auto;
                    bottom: $size-tiny-space;
                }
                @include monospace();
            }
        }
    }

    .bottom {
        height: calc(100% - #{$top-height} - #{$size-main-margin}*2);
        margin-top: $size-main-margin;

        .animated-table {
            height: 100%;
        }
    }
}
</style>