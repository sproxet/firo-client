<template>
    <div class="receive-page">
        <div class="top">
            <div class="inner">
                <div ref="qrCode" class="qr-code" />

                <div v-if="address" class="address monospace loaded">
                    <a @click.prevent="copyAddress" id="receive-address" href="#" title="Click to copy address">
                        {{ address }}
                    </a>

                    <div class="add-label">
                        <label>
                            Add label:
                        </label>

                        <input type="text" v-model="label" @keydown.enter="addLabel" />
                        <input type="button" value="Go!" @click="addLabel" />
                    </div>
                </div>

                <div v-else class="address loading">
                    Loading...
                </div>
            </div>
        </div>

        <div class="bottom">
        </div>
    </div>
</template>

<script>
import {clipboard} from "electron";
import QRCode from "easyqrcodejs";
import {mapGetters} from "vuex";

export default {
    name: "ReceivePage",

    data: () => ({
        address: null,
        label: '',
        isAdding: false,
        qrCode: null,
        watcher: null
    }),

    computed: mapGetters({
        paymentRequests: 'PaymentRequest/paymentRequests',
        addresses: 'Transactions/addresses'
    }),

    async created() {
        // Make sure everything shows properly on reload.
        while (!window.$daemon) {
            await new Promise(r => setTimeout(r, 10));
        }

        await this.displayAddress();
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
            this.address = await $daemon.getUnusedAddress();

            if (this.paymentRequests[this.address]) {
                this.label = this.paymentRequests[this.address].label;
            }

            if (!this.qrcode) {
                const qrSize = 500 + Math.floor(this.$refs.qrCode.clientHeight * 0.9);
                const logoSize = Math.floor(qrSize * 0.25);

                this.qrcode = new QRCode(this.$refs.qrCode, {
                    text: this.address,
                    height: qrSize,
                    width: qrSize,
                    colorDark: 'black',
                    colorLight: 'white',
                    logo: '/assets/FiroSymbol.svg',
                    // $firo-silver
                    logoBackgroundColor: 'white',
                    logoWidth: logoSize,
                    logoHeight: logoSize
                });
            } else {
                // Update the address in the QR code.
                this.qrcode.makeCode(this.address);
            }
        },

        copyAddress() {
            clipboard.writeText(this.address);
        },

        async addLabel() {
            if (!this.address) return;
            if (this.isAdding) return;
            this.isAdding = true;

            const pr = await $daemon.createPaymentRequest(undefined, this.label, '', this.address);
            await this.$store.dispatch('PaymentRequest/addOrUpdatePaymentRequestFromResponse', pr);

            while (true) {
                await new Promise(resolve => setTimeout(resolve, 10));

                if (this.paymentRequests[pr.address]) {
                    this.$router.push('/payment-request/' + pr.address);
                    break;
                }
            }

            await this.displayAddress();
            this.isAdding = false;
        }
    }
}
</script>

<style scoped lang="scss">
.receive-page {
    .top {
        height: 50%;

        .inner {
            display: flex;
            flex-flow: column;
            justify-content: flex-end;

            .qr-code {
                flex-grow: 1;
            }

            .address {
                height: fit-content;
                flex-grow: 0;
            }
        }
    }

    .bottom {
        height: 50%;
    }
}
</style>