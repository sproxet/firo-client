<template>
    <section class="send-detail">
        <div class="inner">
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

                    <div class="input-with-tip-container">
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

                        <span class="tip ticker">
                            XFR
                        </span>
                    </div>
                </div>

                <div class="field">
                    <a id="select-custom-inputs" href="#" @click="selectCustomInputs()">
                        Select Custom Inputs
                    </a>
                </div>

                <div class="field">
                    <label>
                        <input type="checkbox" v-model="useCustomFee" />
                        Custom Transaction Fee
                    </label>

                    <div v-show="useCustomFee" class="input-with-tip-container">
                        <input
                            id="txFeePerKb"
                            ref="txFeePerKb"
                            v-model.number="txFeePerKb"
                            v-validate.initial="'txFeeIsValid'"
                            v-tooltip="getValidationTooltip('txFeePerKb')"
                            type="text"
                            name="txFeePerKb"
                            tabindex="4"
                        />

                        <span class="tip">
                            sat/kb
                        </span>
                    </div>
                </div>

                <div class="field" id="subtract-fee-from-amount">
                    <input v-model="subtractFeeFromAmount" type="checkbox" checked />
                    <label>
                        Take Transaction Fee From Amount
                    </label>
                </div>
            </div>

            <div id="bottom">
                <div id="totals">
                    <div class="total-field" id="receive-amount">
                        <label>
                            Recipient will receive:
                        </label>

                        <div v-if="transactionFee" class="value">
                            <amount :amount="amountToReceive" /> <span class="ticker">XFR</span>
                        </div>
                        <div v-else class="value" />
                    </div>

                    <div class="total-field" id="transaction-fee">
                        <label>
                            Transaction fee:
                        </label>

                        <div v-if="transactionFee" class="value">
                            <amount :amount="transactionFee" /> <span class="ticker">XFR</span>
                        </div>
                        <div v-else class="value" />
                    </div>

                    <div class="total-field" id="total-amount">
                        <label>
                            Total:
                        </label>

                        <div v-if="transactionFee" class="value">
                            <amount :amount="totalAmount" /> <span class="ticker">XFR</span>
                        </div>

                        <div v-else class="value" />
                    </div>

                    <div v-if="error" class="error">
                        {{ error }}
                    </div>
                </div>

                <SendFlow
                    :disabled="!canBeginSend"
                    :is-private="isPrivate"
                    :label="label"
                    :address="address"
                    :amount="satoshiAmount"
                    :tx-fee-per-kb="txFeePerKb || 1"
                    :computed-tx-fee="transactionFee"
                    :subtract-fee-from-amount="subtractFeeFromAmount"
                    @success="cleanupForm"
                />

                <div class="footer">
                    <label id="private-balance-label">PRIVATE BALANCE:</label>
                    <div id="private-balance">{{ convertToCoin(availablePrivate) }} <span class="ticker">XFR</span></div>
                    <label id="public-balance-label">PUBLIC BALANCE:</label>
                    <div id="public-balance">{{ convertToCoin(availablePublic) }} <span class="ticker">XFR</span></div>
                    <div id="toggle">
                        PRIVATE
                        <div class="toggle-switch" :class="isPrivate ? 'private' : 'public'" @click="togglePrivatePublic()">
                            <div class="inner" />
                        </div>
                        PUBLIC
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import { mapGetters } from 'vuex';
import SendFlow from "renderer/components/SendPage/SendFlow";
import {isValidAddress} from 'lib/isValidAddress';
import {convertToSatoshi, convertToCoin} from 'lib/convert';
import Amount from "renderer/components/Sidebar/Amount";
import {ZcoindErrorResponse} from "daemon/zcoind";

export default {
    name: 'SendDetail',

    components: {
        SendFlow,
        Amount
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
            useCustomFee: false,
            txFeePerKb: 1,
            isPrivate: true,

            // This is the total, computed transaction fee.
            transactionFee: 0,

            // This is used if an error occurs computing the fee
            error: null,
        }
    },

    computed: {
        ...mapGetters({
            network: 'ApiStatus/network',
            availablePrivate: 'Balance/available',
            availablePublic: 'Balance/availablePublic',
            maxPrivateSend: 'Balance/maxPrivateSend',
            selectedUtxos: 'ZcoinPayment/selectedInputs'
        }),

        available () {
            return this.isPrivate ? this.availablePrivate : this.availablePublic;
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
                // Make sure the validation warning goes away.
                this.$refs.txFeePerKb.value = 1;
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
        },

        isPrivate: {
            handler: 'maybeShowFee'
        }
    },

    beforeMount () {
        // Set up VeeValidator rules.

        this.$validator.extend('zcoinAddress', {
            getMessage: () => 'The Firo address you entered is invalid',
            validate: (value) => isValidAddress(value, this.network)
        });

        this.$validator.extend('amountIsWithinAvailableBalance', {
            // this.availableXzc will still be reactively updated.
            getMessage: () => this.coinControlSelectedAmount ?
                `Amount is over the sum of your selected coins, ${convertToCoin(this.coinControlSelectedAmount)} XFR`
                :
                `Amount is over your available balance of ${convertToCoin(this.available)} XFR`,

            validate: (value) => this.coinControlSelectedAmount ?
                convertToSatoshi(value) <= this.coinControlSelectedAmount
                :
                convertToSatoshi(value) <= this.available
        });

        this.$validator.extend('publicAmountIsValid', {
            getMessage: () => 'Amount must be a multiple of 0.00000001',
            // We use a regex here so as to not to have to deal with floating point issues.
            validate: (value) => Number(value) !== 0 && !!value.match(/^\d+(\.\d{1,8})?$/)
        });

        this.$validator.extend('privateAmountIsValid', {
            getMessage: () => 'Amount for private send must be a multiple of 0.05',
            validate: (value) => {
                const v = convertToSatoshi(value);
                return (v % 5e6 === 0) && (v > 0);
            }
        });

        this.$validator.extend('privateAmountIsWithinBounds', {
            getMessage: () => 'Amount for private send may not exceed 500 XFR',
            validate: (value) => Number(value) <= 500
        });

        this.$validator.extend('privateAmountDoesntViolateInputLimits', {
            getMessage: () =>
                `Due to private transaction input limits, you can currently spend no more than ` +
                `${convertToCoin(this.maxPrivateSend)} XFR in one transaction. Try minting a larger denomination.`,

            validate: (value) => convertToSatoshi(value) <= this.maxPrivateSend
        });

        this.$validator.extend('txFeeIsValid', {
            getMessage: () => 'Transaction fee must be an integer between 1 and 10,000',
            validate: (value) => value > 0 && value <= 10_000 && (value % 1 === 0)
        })
    },

    methods: {
        convertToCoin,

        togglePrivatePublic() {
            this.isPrivate = !this.isPrivate;
        },

        async maybeShowFee () {
            this.transactionFee = 0;
            this.error = null;
            this.totalAmountExceedsBalance = false;

            try {
                // The empty string for an amount won't issue a validation error, but it would be invalid to pass to zcoind.
                if (
                    (this.useCustomFee && !await this.$validator.validate('txFeePerKb')) ||
                    !(Number(this.txFeePerKb) > 0) ||
                    !await this.$validator.validate('amount') ||
                    this.satoshiAmount === 0
                ) {
                    return;
                }
            } catch {
                // On startup, $validator.validate() will throw an error because we're called before the page is loaded.
                return;
            }

            const satoshiAmount = this.satoshiAmount;
            const subtractFeeFromAmount = this.subtractFeeFromAmount;
            const txFeePerKb = this.useCustomFee ? this.txFeePerKb : 1;

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
                    this.error = e;
                } else {
                    this.error = `${e}`;
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
        },

        async selectCustomInputs() {
            this.$store.commit('ZcoinPayment/ENTERED_SEND_AMOUNT', this.amount? this.amount : 0);
            this.$store.dispatch('ZcoinPayment/TOGGLE_CUSTOM_INPUTS_POPUP');
        }
    }
}
</script>

<style lang="scss" scoped>
@import "src/renderer/styles/inputs";
@import "src/renderer/styles/sizes";
@import "src/renderer/styles/typography";

label {
    @include label();
}

.input-with-tip-container {
    width: fit-content;
    position: relative;

    .tip {
        position: absolute;
        bottom: $size-rounded-input-vertical-padding;
        right: $size-rounded-input-horizontal-padding;
    }
}

.ticker {
    @include ticker();
}

.send-detail {
    width: $size-secondary-content-width;
    float: right;
    box-sizing: border-box;
    padding: $size-detail-margin;
    height: 100%;
    background-color: $color-detail-background;

    .inner {
        height: 100%;
        display: flex;
        flex-flow: column;

        #top {
            flex-grow: 1;

            .field {
                &:not(:first-child) {
                    margin-top: $size-between-field-space-big;
                }

                label, input[type="text"] {
                    display: block;
                }

                input[type="text"] {
                    @include wide-rounded-input();
                }

                &#address-field {
                    input {
                        @include address();
                    }
                }

                &#select-custom-inputs {
                    a {
                        @include optional-action();
                    }
                }

                &#subtract-fee-from-amount {
                    * {
                        display: inline;
                    }
                }
            }
        }

        #bottom {
            #totals {
                .total-field {
                    margin-bottom: $size-small-space;

                    label, .value {
                        display: inline;
                    }

                    label {
                        margin-right: $size-medium-space;
                    }

                    .value {
                        float: right;
                    }
                }
            }

            .error {
                @include error();
                margin-bottom: $size-small-space;
            }

            .footer {
                @include small();
                margin-top: $size-small-space;

                display: grid;
                grid-gap: $size-tiny-space;

                #private-balance-label {
                    grid-row: 1;
                    grid-column: 1;
                }

                #private-balance {
                    text-align: right;
                    grid-row: 1;
                    grid-column: 2;
                }

                #public-balance-label {
                    grid-row: 2;
                    grid-column: 1;
                }

                #public-balance {
                    text-align: right;
                    grid-row: 2;
                    grid-column: 2;
                }

                #toggle {
                    @include label();
                    user-select: none;
                    grid-row: 2;
                    grid-column: 4;
                    justify-self: end;

                    .toggle-switch {
                        height: 0.7em;
                        width: $size-medium-space;
                        padding: 1px;
                        display: inline-block;
                        background-color: black;
                        border-radius: 5px;

                        .inner {
                            height: 0.7em;
                            display: inline-block;
                            position: relative;
                            width: $size-medium-space / 2;
                            background-color: red;
                            border-radius: 5px;

                            @at-root #toggle .private .inner {
                                float: left;
                            }

                            @at-root #toggle .public .inner {
                                float: right;
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>
