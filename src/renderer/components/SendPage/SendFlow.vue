<template>
    <div>
        <div class="buttons">
            <button :disabled="disabled" @click="show = 'confirm'">
                Send
            </button>
        </div>

        <Popup v-if="show !== 'button'">
            <ConfirmStep
                v-if="show === 'confirm'"
                :label="label"
                :address="address"
                :amount="amount"
                :fee="computedTxFee"
                @cancel="cancel()"
                @confirm="show = 'passphrase'"
            />
            <PassphraseStep v-if="show === 'passphrase'" :error="error" @cancel="cancel()" @confirm="attemptSend" />
            <ErrorStep v-if="show === 'error'" :error="error" @ok="cancel()" />
        </Popup>
    </div>
</template>

<script>
// $emits: success

import {IncorrectPassphrase, ZcoindErrorResponse} from "daemon/zcoind";
import Popup from "../Popup";
import ConfirmStep from "./ConfirmStep";
import PassphraseStep from "./PassphraseStep";
import ErrorStep from "./ErrorStep";

export default {
    name: "SendFlow",

    components: {
        Popup,
        ConfirmStep,
        PassphraseStep,
        ErrorStep
    },

    data() {
        return {
            error: null,
            show: 'button'
        }
    },

    props: {
        disabled: {
            required: true,
            type: Boolean
        },

        label: {
            required: true,
            type: String,
        },

        address: {
            required: true,
            type: String
        },

        amount: {
            required: true,
            type: Number
        },

        txFeePerKb: {
            required: true,
            type: Number
        },

        computedTxFee: {
            required: true,
            type: Number
        },

        subtractFeeFromAmount: {
            required: true,
            type: Boolean
        },

        isPrivate: {
            required: true,
            type: Boolean
        }
    },

    methods: {
        cancel() {
            this.error = null;
            this.show = 'button';
        },

        async attemptSend () {
            try {
                if (this.isPrivate) {
                    await $daemon.privateSend(this.passphrase, this.label, this.address, this.amount,
                        this.subtractFeeFromAmount);
                } else {
                    let d = await $daemon.publicSend(this.passphrase, this.label, this.address, this.amount,
                        this.txFeePerKb, this.subtractFeeFromAmount);
                }
            } catch (e) {
                if (e instanceof IncorrectPassphrase) {
                    this.error = 'Incorrect Passphrase';
                    this.show = 'passphrase';
                } else if (e instanceof ZcoindErrorResponse) {
                    this.error = e.errorMessage;
                    this.show = 'error';
                } else {
                    this.error = `${e}`;
                    this.show = 'error';
                }

                return;
            }

            this.error = null;
            this.show = 'button';
            this.$emit('success');
        },

    }
}
</script>

<style scoped lang="scss">
@import "src/renderer/styles/inputs";

.buttons {
    @include buttons-container();
}
</style>