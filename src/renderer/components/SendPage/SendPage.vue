<template>
    <section id="send">
        <div id="top">
            <div class="field" id="label-field">
                <label>
                    Label
                </label>

                <input
                    id="label"
                    ref="label"
                    v-model.trim="label"
                    v-focus
                    type="text"
                    name="label"
                    tabindex="1"
                    placeholder="Label"
                />
            </div>

            <div class="field" id="address-field">
                <label>
                    Address
                </label>

                <input
                    id="address"
                    ref="address"
                    v-model="address"
                    v-validate.initial="'zcoinAddress'"
                    v-tooltip="getValidationTooltip('address')"
                    type="text"
                    name="address"
                    tabindex="2"
                    placeholder="Address"
                />
            </div>

            <div class="field" id="amount-field">
                <label>
                    Amount
                </label>

                <input
                    id="amount"
                    ref="amount"
                    v-model="amount"
                    v-validate.initial="amountValidations"
                    v-tooltip="getValidationTooltip('amount')"
                    type="text"
                    name="amount"
                    class="amount"
                    tabindex="3"
                    placeholder="Amount"
                />

                <a @click="selectCustomInputs()">
                    Select Custom Inputs
                </a>

                <div id="subtract-fee-from-amount">
                    <input v-model="subtractFeeFromAmount" type="checkbox" checked />
                    <label>
                        Take Transaction Fee From Amount
                    </label>
                </div>
            </div>
        </div>

        <div id="bottom">
            <div class="totals">
                <div class="total-field" id="receive-amount">
                    <label>
                        Recipient will receive:
                    </label>

                    <div v-if="transactionFee" class="value">
                        {{ convertToCoin(amountToReceive) }} XFR
                    </div>
                    <div v-else class="value" />
                </div>

                <div class="total-field" id="transaction-fee">
                    <label>
                        Transaction fee:
                    </label>

                    <div v-if="transactionFee" class="value">
                        {{ convertToCoin(transactionFee) }} XFR
                    </div>
                    <div v-else class="value" />
                </div>

                <div class="field" id="total-amount">
                    <label>
                        Total:
                    </label>

                    <div v-if="transactionFee" class="value">
                        {{ convertToCoin(totalAmount) }} XFR
                    </div>

                    <div v-else class="value" />

                    <div v-if="totalAmountExceedsBalance" class="total-amount-exceeds-balance">
                        Amount (including fees) exceeds available balance.
                    </div>
                </div>
            </div>

            <div class="button">
                <SendFlow id="send-flow" :disabled="false" :is-private="isPrivate" @success="cleanupForm" />
            </div>
        </div>
    </section>
</template>

<script>
import { mapGetters } from 'vuex';
import SendFlow from "./SendFlow";
import {isValidAddress} from 'lib/isValidAddress';
import {convertToSatoshi, convertToCoin} from 'lib/convert';

export default {
    name: 'Send',

    components: {
        SendFlow
    },

    inject: [
        '$validator'
    ],

    data () {
        return {
            label: this.$route.query.label || '',
            amount: this.$route.query.amount || '',
            address: this.$route.query.address || '',
            subtractFeeFromAmount: true,
            passphrase: '',

            errorMessage: '',

            // Valid progressions are:
            //
            // initial -> waitToConfirm
            // waitToConfirm -> confirm
            // confirm -> initial | passphrase
            // passphrase -> initial | incorrectPassphrase | error | complete
            // error -> initial
            // incorrectPassphrase -> initial | passphrase
            // complete -> initial
            sendPopoverStep: 'initial',

            useCustomFee: false,
            txFeePerKb: 1,

            // This is the total, computed transaction fee.
            transactionFee: 0,

            // This is set if error -6 occurs during fee calculation.
            totalAmountExceedsBalance: false,
        }
    },

    computed: {
        ...mapGetters({
            network: 'ApiStatus/network',
            availablePrivate: 'Balance/available',
            availablePublic: 'Balance/availablePublic',
            selectedUtxos: 'ZcoinPayment/selectedInputs'
        }),

        // Return either 'private' or 'public', depending on whether the user is intending to make a private or a public
        // send.
        isPrivate () {
            return true;
        },

        available () {
            return this.privateOrPublic === 'private' ? this.availablePrivate : this.availablePublic;
        },

        // This is the amount the user entered in satoshis.
        satoshiAmount () {
            return convertToSatoshi(this.amount);
        },

        // This is the amount the user will receive. It may be less than satoshiAmount.
        amountToReceive () {
            return this.subtractFeeFromAmount ? this.satoshiAmount - this.transactionFee : this.satoshiAmount;
        },

        // This is the total amount that will be sent, including transaction fee.
        totalAmount () {
            return this.subtractFeeFromAmount ? this.satoshiAmount : this.satoshiAmount + this.transactionFee;
        },

        // We can begin the send if the fee has been shown and the form is valid.
        canBeginSend () {
            return this.isValidated && this.transactionFee > 0 && !this.totalAmountExceedsBalance;
        },

        isValidated () {
            // this.errors was already calculated when amount and address were entered.
            return !!(this.amount && this.address && this.txFeePerKb && !this.validationErrors.items.length);
        },

        coinControlSelectedAmount() {
            return (this.selectedUtxos || []).reduce((a, e) => a + e.amount, 0);
        },

        amountValidations () {
            return this.isPrivate ?
                'amountIsWithinAvailableBalance|privateAmountIsValid|privateAmountIsWithinBounds|privateAmountDoesntViolateInputLimits'
                :
                'amountIsWithinAvailableBalance|publicAmountIsValid'
        },

        getValidationTooltip () {
            return (fieldName) => ({
                content: this.validationErrors.first(fieldName),
                trigger: 'manual',
                boundariesElement: 'body',
                offset: 8,
                placement: 'left',
                classes: 'error',
                show: true
            })
        }
    },

    watch: {
        $route(to) {
            this.address = to.query.address || '';
            this.label = to.query.label || '';
            this.amount = to.query.amount || '';
        },

        txFeePerKb: {
            handler: 'maybeShowFee',
            immediate: true
        },

        useCustomFee() {
            if (!this.useCustomFee) {
                this.txFeePerKb = 1;
            }
        },

        amount: {
            handler: 'maybeShowFee',
            immediate: true
        },

        subtractFeeFromAmount: {
            handler: 'maybeShowFee',
            immediate: true
        },

        isValidated: {
            handler: 'maybeShowFee'
        }
    },

    beforeMount () {
        // Set up VeeValidator rules.

        this.$validator.extend('zcoinAddress', {
            getMessage: () => 'Invalid Zcoin Address',
            validate: (value) => isValidAddress(value, this.network)
        });

        this.$validator.extend('amountIsWithinAvailableBalance', {
            // this.availableXzc will still be reactively updated.
            getMessage: () => this.coinControlSelectedAmount == 0? ('Amount Is Over Your Available Balance of ' + convertToCoin(this.availableBalance)):'Amount Is Over Your Selected Amount of ' + convertToCoin(this.coinControlSelectedAmount),
            validate: (value) => (this.coinControlSelectedAmount == 0 && convertToSatoshi(value) <= this.availableBalance)
                                || (this.coinControlSelectedAmount > 0 && convertToSatoshi(value) <= this.coinControlSelectedAmount)
        });

        this.$validator.extend('publicAmountIsValid', {
            getMessage: () => 'Amount Must Be A Multiple of 0.00000001',
            // We use a regex here so as to not to have to deal with floating point issues.
            validate: (value) => Number(value) !== 0 && !!value.match(/^\d+(\.\d{1,8})?$/)
        });

        this.$validator.extend('privateAmountIsValid', {
            getMessage: () => 'Amount For Private SendPage Must Be A Multiple of 0.05',
            validate: (value) => {
                const v = convertToSatoshi(value);
                return (v % 5e6 === 0) && (v > 0);
            }
        });

        this.$validator.extend('privateAmountIsWithinBounds', {
            getMessage: () => 'Amount For Private SendPage May Not Exceed 500 XZC',
            validate: (value) => Number(value) <= 500
        });

        this.$validator.extend('privateAmountDoesntViolateInputLimits', {
            getMessage: () =>
                `Due to private transaction input limits, you can currently spend no more than ` +
                `${convertToCoin(this.maxPrivateSend)} XZC in one transaction. Try minting a larger denomination.`,

            validate: (value) => convertToSatoshi(value) <= this.maxPrivateSend
        });
    },

    methods: {
        convertToCoin,

        async maybeShowFee () {
            this.totalAmountExceedsBalance = false;

            try {
                // The empty string for an amount won't issue a validation error, but it would be invalid to pass to zcoind.
                if (
                    !await this.$validator.validate('txFeePerKb') ||
                    !await this.$validator.validate('amount') ||
                    typeof this.txFeePerKb !== 'number' ||
                    this.satoshiAmount === 0
                ) {
                    this.transactionFee = 0;
                    return;
                }
            } catch {
                // On startup, $validator.validate() will through an error because we're called before the page is loaded.
                this.transactionFee = 0;
                return;
            }

            const satoshiAmount = this.satoshiAmount;
            const subtractFeeFromAmount = this.subtractFeeFromAmount;
            const txFeePerKb = this.txFeePerKb;

            let p;
            if (this.isPrivate) {
                p = $daemon.calcPrivateTxFee(satoshiAmount, subtractFeeFromAmount);
            } else {
                p = $daemon.calcPublicTxFee(satoshiAmount, subtractFeeFromAmount, txFeePerKb);
            }

            try {
                const txFee = await p;
                if (this.satoshiAmount === satoshiAmount && this.subtractFeeFromAmount === subtractFeeFromAmount && this.txFeePerKb === txFeePerKb) {
                    this.transactionFee = txFee
                }
            } catch (e) {
                if (e instanceof ZcoindErrorResponse && e.errorCode === -6) {
                    this.totalAmountExceedsBalance = true;
                } else {
                    throw e;
                }
            }
        },

        send() {
            throw 'unimplemented'
        },

        cleanupForm () {
            this.label = '';
            this.amount = '';
            this.address = '';
            this.passphrase = '';
        },

        async selectCustomInputs() {
            this.$store.commit('ZcoinPayment/ENTERED_SEND_AMOUNT', this.amount? this.amount : 0);
            this.$store.dispatch('ZcoinPayment/TOGGLE_CUSTOM_INPUTS_POPUP');
        },

        async openAddressBook() {
            if (!this.addressBook || Object.keys(this.addressBook).length == 0) {
                const ab = await $daemon.readAddressBook();
                this.$store.dispatch('Transactions/setAddressBook', ab);
            }
            this.$store.dispatch('App/OPEN_ADDRESS_BOOK', {open: true, address: '', purpose: 'send'});
        }
    }
}
</script>

<style lang="scss" scoped>
@import "src/renderer/styles/inputs";

#send {
    height: 100%;
    display: flex;
    flex-flow: column;

    #bottom {
        flex-grow: 1;
    }
}
</style>
