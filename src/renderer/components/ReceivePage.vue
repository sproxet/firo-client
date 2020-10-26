<template>
    <div class="receive-page">
        <div class="top">
            <div ref="outerQrCode" class="outer">
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
                :data="receiveAddresses"
                :track-by="'address'"
                :on-row-select="navigateToAddressBookItem"
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
import AddressBookItemLabel from "renderer/components/AnimatedTable/AddressBookItemLabel";
import AddressBookItemAddress from "renderer/components/AnimatedTable/AddressBookItemAddress";

export default {
    name: "ReceivePage",

    components: {
        AnimatedTable
    },

    data() {
        return {
            address: null,
            label: '',
            isEditing: false,
            qrCode: null,
            resizeListener: () => this.resizeQrCode(),

            tableFields: [
                {name: AddressBookItemLabel},
                {name: AddressBookItemAddress}
            ]
        };
    },

    computed: {
        ...mapGetters({
            addressBook: 'AddressBook/addressBook',
            receiveAddresses: 'AddressBook/receiveAddresses',
            addresses: 'Transactions/addresses'
        })
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
        receiveAddresses() {
            if (this.addressBook[this.address]) {
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
        navigateToAddressBookItem(item) {
            if (this.$route.params.address === item.address) return;
            this.$router.push(`/receive/${item.address}`);
            this.displayAddress();
        },

        async displayAddress() {
            if (this.$route.params.address) {
                this.address = this.$route.params.address;
            } else {
                this.address = await $daemon.getUnusedAddress();
            }

            if (this.addressBook[this.address] && this.addressBook[this.address].label) {
                this.label = this.addressBook[this.address].label;
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
            this.$refs.outerQrCode.classList.remove('shadow');
            this.$refs.qrContainerInner.style.display = 'none';

            const size = `${this.$refs.qrContainer.clientHeight}px`;
            const img = this.$refs.qrCode.querySelector('img');
            img.style.height = size;
            img.style.width = size;
            img.style.display = 'initial';

            this.$refs.qrContainerInner.style.display = 'initial';
            this.$refs.outerQrCode.classList.add('shadow');
        },

        copyAddress() {
            clipboard.writeText(this.address);
        },

        async changeLabel() {
            if (!this.address) return;
            this.isEditing = false;

            const newAddress = await $daemon.updateAddressBookItem(this.addressBook[this.address], this.label);
            await this.$store.commit('AddressBook/updateAddress', newAddress);
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

            &.shadow {
                box-shadow: $size-shadow-radius $size-shadow-radius $size-shadow-radius $size-shadow-radius $color-shadow;
            }

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